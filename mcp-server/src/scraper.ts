import { chromium, type Browser } from "playwright";

export interface PageData {
  imageUrl: string;
  directImageUrl?: string;
}

export interface ScrapeProgress {
  status: "scraping" | "building_pdf" | "done" | "error";
  currentPage: number;
  totalPages: number;
  documentTitle?: string;
  error?: string;
}

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
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
  onProgress?: (progress: ScrapeProgress) => void
): Promise<{ pdfBuffer: Buffer; title: string; pageCount: number }> {
  if (!isValidDocSendUrl(url)) {
    throw new Error(`Invalid DocSend URL: ${url}`);
  }

  const notify = onProgress ?? (() => {});
  const navigateUrl = normalizeUrl(url);
  const b = await getBrowser();
  const context = await b.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  await context.route(
    /\.(woff2?|ttf|eot|otf|mp4|webm|ogg|mp3)(\?.*)?$/i,
    (route) => route.abort()
  );

  try {
    await page.goto(navigateUrl, { waitUntil: "networkidle" });
    await page
      .waitForSelector(
        'input[name="link_auth_form[email]"], input[type="password"], .document-page, [class*="page"]',
        { timeout: 5000 }
      )
      .catch(() => {});

    await handleAuth(page, options);

    const baseUrl = page.url().replace(/\/$/, "");

    const documentTitle = await page
      .title()
      .then((t) =>
        t
          .replace(/ \| DocSend$/, "")
          .replace(/^DocSend$/, "Document")
          .trim()
      );

    const totalPages = await extractPageCount(page);
    if (totalPages === 0) {
      throw new Error(
        "Could not determine page count. The link may be invalid or the password incorrect."
      );
    }

    notify({
      status: "scraping",
      currentPage: 0,
      totalPages,
      documentTitle,
    });

    await context.unroute("**/*");

    // Phase 1: Fetch all page metadata in parallel
    const pageDataResults: (PageData | null)[] = new Array(totalPages).fill(
      null
    );

    const pageDataPromises = Array.from({ length: totalPages }, (_, i) => {
      const pageNum = i + 1;
      return page.request
        .get(`${baseUrl}/page_data/${pageNum}`)
        .then((res) => (res.ok() ? (res.json() as Promise<PageData>) : null))
        .then((data) => {
          pageDataResults[i] = data;
        })
        .catch(() => {});
    });
    await Promise.all(pageDataPromises);

    // Phase 2: Download images in batches (use page.request for cookie auth)
    const IMAGE_BATCH_SIZE = 10;
    const imageBuffers: (Buffer | null)[] = new Array(totalPages).fill(null);

    for (
      let batchStart = 0;
      batchStart < totalPages;
      batchStart += IMAGE_BATCH_SIZE
    ) {
      const batchEnd = Math.min(batchStart + IMAGE_BATCH_SIZE, totalPages);
      const batchPromises: Promise<void>[] = [];

      for (let i = batchStart; i < batchEnd; i++) {
        const pageData = pageDataResults[i];
        if (!pageData) continue;
        const pageNum = i + 1;
        batchPromises.push(
          downloadImage(pageData, pageNum, page)
            .then((buf) => {
              imageBuffers[i] = buf;
            })
            .catch((err) => {
              console.error(
                `Skipped page ${pageNum}: ${err instanceof Error ? err.message : err}`
              );
            })
        );
      }

      await Promise.all(batchPromises);

      notify({
        status: "scraping",
        currentPage: batchEnd,
        totalPages,
        documentTitle,
      });
    }

    const validBuffers = imageBuffers.filter((b): b is Buffer => b !== null);

    if (validBuffers.length === 0) {
      throw new Error("No pages could be downloaded.");
    }

    notify({
      status: "building_pdf",
      currentPage: totalPages,
      totalPages,
      documentTitle,
    });

    const { buildPdf } = await import("./pdf-builder.js");
    const pdfBuffer = await buildPdf(validBuffers);

    notify({
      status: "done",
      currentPage: totalPages,
      totalPages,
      documentTitle,
    });

    return { pdfBuffer, title: documentTitle, pageCount: validBuffers.length };
  } finally {
    await context.close();
  }
}

async function handleAuth(
  page: import("playwright").Page,
  options: { email?: string; passcode?: string }
) {
  const emailInput = page.locator('input[name="link_auth_form[email]"]');
  const emailVisible = await emailInput.isVisible().catch(() => false);

  if (emailVisible) {
    if (!options.email) {
      throw new Error(
        "This document requires an email address. Provide one with the email parameter."
      );
    }

    await emailInput.fill(options.email);

    const submitBtn = page.locator(
      '#new_link_auth_form button[type="submit"]'
    );
    await Promise.all([
      page
        .waitForNavigation({ waitUntil: "networkidle", timeout: 15000 })
        .catch(() => {}),
      submitBtn.click(),
    ]);

    await page
      .waitForFunction(
        () => {
          const emailInput = document.querySelector(
            'input[name="link_auth_form[email]"]'
          );
          if (
            !emailInput ||
            (emailInput as HTMLElement).offsetParent === null
          )
            return true;
          const body = document.body.innerText;
          if (/valid email|verify|bestätigen/i.test(body)) return true;
          return false;
        },
        { timeout: 10000 }
      )
      .catch(() => {});

    const validationError = page
      .locator("text=/valid email|gültige E-Mail/i")
      .first();
    const hasValidationError = await validationError
      .isVisible()
      .catch(() => false);

    if (hasValidationError) {
      throw new Error(
        "DocSend rejected the email address. Please use a valid email."
      );
    }

    const confirmPage = page
      .locator("text=/confirmation|verify your|bestätigen/i")
      .first();
    const isConfirmPage = await confirmPage.isVisible().catch(() => false);
    if (isConfirmPage) {
      throw new Error(
        "DocSend requires email verification. Try using a business email address."
      );
    }
  }

  const passwordInput = page.locator('input[type="password"]').first();
  const passwordVisible = await passwordInput.isVisible().catch(() => false);

  if (passwordVisible) {
    if (!options.passcode) {
      throw new Error(
        "This document requires a passcode. Provide one with the passcode parameter."
      );
    }
    await passwordInput.fill(options.passcode);
    const pwSubmitBtn = page
      .locator(
        '#new_link_auth_form button[type="submit"], form button[type="submit"]'
      )
      .first();
    await Promise.all([
      page
        .waitForNavigation({ waitUntil: "networkidle", timeout: 15000 })
        .catch(() => {}),
      pwSubmitBtn.click(),
    ]);
    await page
      .waitForFunction(
        () => {
          const pwInput = document.querySelector('input[type="password"]');
          return !pwInput || (pwInput as HTMLElement).offsetParent === null;
        },
        { timeout: 10000 }
      )
      .catch(() => {});
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
  const baseUrl = page.url().replace(/\/$/, "");

  try {
    const res = await page.request.get(`${baseUrl}/page_data/1`);
    if (!res.ok()) return 0;
  } catch {
    return 0;
  }

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
  pageNumber: number,
  page: import("playwright").Page
): Promise<Buffer> {
  if (!pageData.imageUrl) {
    throw new Error(`No imageUrl for page ${pageNumber}`);
  }

  const urlsToTry = [pageData.imageUrl, pageData.directImageUrl].filter(
    Boolean
  ) as string[];

  for (const imgUrl of urlsToTry) {
    // Try with Playwright request context first (has cookies)
    try {
      const pwRes = await page.request.get(imgUrl);
      if (pwRes.ok()) {
        return Buffer.from(await pwRes.body());
      }
    } catch {
      // fallthrough to native fetch
    }

    // Fallback: native fetch with headers
    try {
      const response = await fetch(imgUrl, {
        headers: {
          Referer: "https://docsend.com/",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
      });
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    } catch {
      // try next URL
    }
  }

  throw new Error(
    `Image download failed for page ${pageNumber} (all URLs tried)`
  );
}

export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
