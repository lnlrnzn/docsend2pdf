import { chromium, type Browser } from "playwright-core";
import type { PageData, ScrapeProgress } from "./types";

const globalForBrowser = globalThis as unknown as { _pwBrowser: Browser | null };
globalForBrowser._pwBrowser = globalForBrowser._pwBrowser ?? null;

async function getBrowser(): Promise<Browser> {
  if (!globalForBrowser._pwBrowser || !globalForBrowser._pwBrowser.isConnected()) {
    const isVercel = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

    if (isVercel) {
      const chromiumModule = await import("@sparticuz/chromium");
      const executablePath = await chromiumModule.default.executablePath();
      globalForBrowser._pwBrowser = await chromium.launch({
        args: chromiumModule.default.args,
        executablePath,
        headless: true,
      });
    } else {
      globalForBrowser._pwBrowser = await chromium.launch({ headless: true });
    }
  }
  return globalForBrowser._pwBrowser;
}

function isValidDocSendUrl(url: string): boolean {
  return /docsend\.com\/(?:view|v\/[a-zA-Z0-9]+)\/[a-zA-Z0-9]+/.test(url);
}

function normalizeUrl(url: string): string {
  if (!url.startsWith("http")) url = `https://${url}`;
  return url.replace(/\/$/, "");
}

export async function scrapeDocSend(
  url: string,
  options: { email?: string; passcode?: string },
  onProgress: (progress: Omit<ScrapeProgress, "jobId">) => void
): Promise<Buffer> {
  if (!isValidDocSendUrl(url)) {
    throw new Error(`Ungültige DocSend-URL: ${url}`);
  }

  const navigateUrl = normalizeUrl(url);
  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  // Unnötige Ressourcen blockieren — wir brauchen nur DOM für Auth + Seitenzahl
  // Nur Fonts und Media blockieren (Stylesheets behalten — DocSend JS kann CSS-Abhängigkeiten haben)
  await context.route(/\.(woff2?|ttf|eot|otf|mp4|webm|ogg|mp3)(\?.*)?$/i, (route) => route.abort());

  try {
    await page.goto(navigateUrl, { waitUntil: "networkidle" });
    // Warte bis entweder Email-Input oder Dokument-Inhalt sichtbar ist
    await page.waitForSelector(
      'input[name="link_auth_form[email]"], input[type="password"], .document-page, [class*="page"]',
      { timeout: 5000 }
    ).catch(() => {});

    // Auth-Handling (muss vor page_data passieren)
    await handleAuth(page, options);

    // Basis-URL für page_data: nutze die URL nach Auth (DocSend kann redirecten)
    const baseUrl = page.url().replace(/\/$/, "");

    // Dokumenttitel extrahieren
    const documentTitle = await page
      .title()
      .then((t) =>
        t
          .replace(/ \| DocSend$/, "")
          .replace(/^DocSend$/, "Dokument")
          .trim()
      );

    // Seitenzahl ermitteln
    const totalPages = await extractPageCount(page);
    if (totalPages === 0) {
      throw new Error(
        "Konnte Seitenzahl nicht ermitteln. Möglicherweise falsches Passwort oder ungültiger Link."
      );
    }

    onProgress({
      status: "scraping",
      currentPage: 0,
      totalPages,
      documentTitle,
    });

    // Route-Handler entfernen — wird für Downloads nicht mehr gebraucht
    await context.unroute("**/*");

    // === Phase 1: Alle page_data parallel fetchen (braucht Cookies via page.request) ===
    const pageDataResults: (PageData | null)[] = new Array(totalPages).fill(null);
    const skippedPages: number[] = [];

    const pageDataPromises = Array.from({ length: totalPages }, (_, i) => {
      const pageNum = i + 1;
      return page.request.get(`${baseUrl}/page_data/${pageNum}`)
        .then((res) => res.ok() ? res.json() as Promise<PageData> : null)
        .then((data) => { pageDataResults[i] = data; })
        .catch(() => { skippedPages.push(pageNum); });
    });
    await Promise.all(pageDataPromises);

    // === Phase 2: Alle Bilder via native fetch downloaden (signierte CDN-URLs) ===
    const IMAGE_BATCH_SIZE = 10;
    const imageBuffers: (Buffer | null)[] = new Array(totalPages).fill(null);

    for (let batchStart = 0; batchStart < totalPages; batchStart += IMAGE_BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + IMAGE_BATCH_SIZE, totalPages);
      const batchPromises: Promise<void>[] = [];

      for (let i = batchStart; i < batchEnd; i++) {
        const pageData = pageDataResults[i];
        if (!pageData) continue;
        const pageNum = i + 1;
        batchPromises.push(
          downloadImage(pageData, pageNum)
            .then((buf) => { imageBuffers[i] = buf; })
            .catch((err) => {
              console.error(`Seite ${pageNum} übersprungen: ${err instanceof Error ? err.message : err}`);
              skippedPages.push(pageNum);
            })
        );
      }

      await Promise.all(batchPromises);

      onProgress({
        status: "scraping",
        currentPage: batchEnd,
        totalPages,
        documentTitle,
      });
    }

    // Nulls (übersprungene Seiten) entfernen
    const validBuffers = imageBuffers.filter((b): b is Buffer => b !== null);

    if (validBuffers.length === 0) {
      throw new Error("Keine Seiten konnten heruntergeladen werden.");
    }

    onProgress({
      status: "building_pdf",
      currentPage: totalPages,
      totalPages,
      documentTitle,
    });

    const { buildPdf } = await import("./pdf-builder");
    const pdfBuffer = await buildPdf(validBuffers);

    onProgress({
      status: "done",
      currentPage: totalPages,
      totalPages,
      documentTitle,
    });

    return pdfBuffer;
  } finally {
    await context.close();
  }
}

async function handleAuth(
  page: import("playwright").Page,
  options: { email?: string; passcode?: string }
) {
  // Prüfe ob E-Mail-Gate vorhanden
  const emailInput = page.locator('input[name="link_auth_form[email]"]');
  const emailVisible = await emailInput.isVisible().catch(() => false);

  if (emailVisible) {
    if (!options.email) {
      throw new Error(
        "Dieses Dokument erfordert eine E-Mail-Adresse. Bitte E-Mail im Formular angeben."
      );
    }

    await emailInput.fill(options.email);

    // Klick + auf Navigation/Reload warten — spezifisch den Submit-Button im Auth-Formular
    const submitBtn = page.locator('#new_link_auth_form button[type="submit"]');
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 }).catch(() => {}),
      submitBtn.click(),
    ]);
    // Warte bis Email-Input verschwindet oder Fehler/Bestätigung erscheint
    await page.waitForFunction(
      () => {
        const emailInput = document.querySelector('input[name="link_auth_form[email]"]');
        if (!emailInput || (emailInput as HTMLElement).offsetParent === null) return true;
        // Oder Fehlermeldung sichtbar
        const body = document.body.innerText;
        if (/gültige E-Mail|valid email|bestätigen|verify/i.test(body)) return true;
        return false;
      },
      { timeout: 10000 }
    ).catch(() => {});

    // Prüfe ob DocSend die E-Mail abgelehnt hat
    const validationError = page
      .locator("text=/gültige E-Mail|valid email/i")
      .first();
    const hasValidationError = await validationError
      .isVisible()
      .catch(() => false);

    if (hasValidationError) {
      const verifyBtn = page
        .locator(
          'button:has-text("bestätigen"), button:has-text("verify"), button:has-text("klicken Sie hier")'
        )
        .first();
      const hasVerifyBtn = await verifyBtn.isVisible().catch(() => false);
      if (hasVerifyBtn) {
        await verifyBtn.click();
        await page.waitForTimeout(3000);
        throw new Error(
          "DocSend hat eine Bestätigungs-E-Mail gesendet. Bitte Link in der E-Mail klicken und dann erneut versuchen."
        );
      }
      throw new Error(
        "DocSend hat die E-Mail-Adresse abgelehnt. Bitte eine gültige E-Mail verwenden."
      );
    }

    // Bestätigungs-E-Mail-Seite?
    const confirmPage = page
      .locator("text=/Bestätigungs|bestätigen Sie|confirmation|verify your/i")
      .first();
    const isConfirmPage = await confirmPage.isVisible().catch(() => false);
    if (isConfirmPage) {
      throw new Error(
        "DocSend verlangt E-Mail-Verifizierung. Bitte eine geschäftliche E-Mail-Adresse verwenden."
      );
    }
  }

  // Prüfe ob Passwort-Gate vorhanden
  const passwordInput = page.locator('input[type="password"]').first();
  const passwordVisible = await passwordInput.isVisible().catch(() => false);

  if (passwordVisible) {
    if (!options.passcode) {
      throw new Error(
        "Dieses Dokument erfordert ein Passwort. Bitte Passwort im Formular angeben."
      );
    }
    await passwordInput.fill(options.passcode);
    const pwSubmitBtn = page.locator('#new_link_auth_form button[type="submit"], form button[type="submit"]').first();
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 }).catch(() => {}),
      pwSubmitBtn.click(),
    ]);
    // Warte bis Passwort-Input verschwindet (Auth erfolgreich)
    await page.waitForFunction(
      () => {
        const pwInput = document.querySelector('input[type="password"]');
        return !pwInput || (pwInput as HTMLElement).offsetParent === null;
      },
      { timeout: 10000 }
    ).catch(() => {});
  }
}

async function extractPageCount(
  page: import("playwright").Page
): Promise<number> {
  const pageCount = await page
    .evaluate(() => {
      const body = document.body.innerText;
      const match = body.match(/\d+\s*[/]\s*(\d+)/);
      if (match) return parseInt(match[1], 10);
      const matchOf = body.match(/\d+\s+of\s+(\d+)/i);
      if (matchOf) return parseInt(matchOf[1], 10);
      return 0;
    })
    .catch(() => 0);

  if (pageCount > 0) return pageCount;
  return await probePageCount(page);
}

async function probePageCount(
  page: import("playwright").Page
): Promise<number> {
  // Binary Search: O(log n) statt O(n) Requests
  const baseUrl = page.url().replace(/\/$/, "");

  // Prüfe ob Seite 1 existiert
  try {
    const res = await page.request.get(`${baseUrl}/page_data/1`);
    if (!res.ok()) return 0;
  } catch {
    return 0;
  }

  // Exponentiell obere Grenze finden
  let upper = 1;
  while (upper <= 500) {
    try {
      const res = await page.request.get(`${baseUrl}/page_data/${upper}`);
      if (!res.ok()) break;
      upper *= 2;
    } catch {
      break;
    }
  }
  upper = Math.min(upper, 500);

  // Binary Search zwischen letztem bekannten Wert und oberer Grenze
  let low = Math.floor(upper / 2);
  let high = upper;

  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    try {
      const res = await page.request.get(`${baseUrl}/page_data/${mid}`);
      if (res.ok()) {
        low = mid;
      } else {
        high = mid - 1;
      }
    } catch {
      high = mid - 1;
    }
  }

  return low;
}

async function downloadImage(
  pageData: PageData,
  pageNumber: number
): Promise<Buffer> {
  if (!pageData.imageUrl) {
    throw new Error(`Keine imageUrl für Seite ${pageNumber}`);
  }

  // Versuche imageUrl, bei Fehler directImageUrl als Fallback
  const urlsToTry = [pageData.imageUrl, pageData.directImageUrl].filter(Boolean) as string[];

  for (const imgUrl of urlsToTry) {
    const response = await fetch(imgUrl, {
      headers: {
        "Referer": "https://docsend.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
    });
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    }
  }

  throw new Error(`Bild-Download für Seite ${pageNumber} fehlgeschlagen (alle URLs probiert)`);
}

export async function closeBrowser() {
  if (globalForBrowser._pwBrowser) {
    await globalForBrowser._pwBrowser.close();
    globalForBrowser._pwBrowser = null;
  }
}
