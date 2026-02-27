#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import { homedir } from "os";
import { join, resolve } from "path";
import { scrapeDocSend, closeBrowser } from "./scraper.js";

const server = new McpServer({
  name: "docsend-scraper",
  version: "1.0.0",
});

server.tool(
  "convert_docsend_to_pdf",
  "Convert a DocSend document to PDF. Scrapes all pages and assembles them into a downloadable PDF file.",
  {
    url: z
      .string()
      .url()
      .describe(
        "The DocSend URL to convert (e.g. https://docsend.com/view/abc123)"
      ),
    email: z
      .string()
      .email()
      .optional()
      .describe(
        "Email address, only required if the document is email-gated"
      ),
    passcode: z
      .string()
      .optional()
      .describe(
        "Passcode, only required if the document is password-protected"
      ),
    outputPath: z
      .string()
      .optional()
      .describe(
        "Custom output file path. Defaults to ~/Downloads/<document-title>.pdf"
      ),
  },
  async ({ url, email, passcode, outputPath }) => {
    try {
      console.error(`[docsend-scraper] Starting: ${url}`);

      const result = await scrapeDocSend(
        url,
        { email, passcode },
        (progress) => {
          if (progress.status === "scraping") {
            console.error(
              `[docsend-scraper] Scraping page ${progress.currentPage}/${progress.totalPages}`
            );
          } else if (progress.status === "building_pdf") {
            console.error(`[docsend-scraper] Building PDF...`);
          }
        }
      );

      // Determine output path
      const safeTitle = result.title
        .replace(/[<>:"/\\|?*]/g, "_")
        .replace(/\s+/g, " ")
        .trim();
      const filename = `${safeTitle || "docsend-document"}.pdf`;

      let finalPath: string;
      if (outputPath) {
        finalPath = resolve(outputPath);
        // If outputPath is a directory, append filename
        if (outputPath.endsWith("/") || outputPath.endsWith("\\")) {
          finalPath = join(resolve(outputPath), filename);
        }
      } else {
        const downloadsDir = join(homedir(), "Downloads");
        await mkdir(downloadsDir, { recursive: true });
        finalPath = join(downloadsDir, filename);
      }

      await writeFile(finalPath, result.pdfBuffer);

      console.error(`[docsend-scraper] Saved: ${finalPath}`);

      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Successfully converted DocSend document to PDF.`,
              ``,
              `Title: ${result.title}`,
              `Pages: ${result.pageCount}`,
              `Saved to: ${finalPath}`,
              `Size: ${(result.pdfBuffer.length / 1024 / 1024).toFixed(1)} MB`,
            ].join("\n"),
          },
        ],
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      console.error(`[docsend-scraper] Error: ${message}`);

      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to convert DocSend document: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[docsend-scraper] MCP server running on stdio");

  // Cleanup on exit
  process.on("SIGINT", async () => {
    await closeBrowser();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await closeBrowser();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
