import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "MCP Server — Convert DocSend to PDF from AI Assistants",
  description:
    "Install the DocSend to PDF MCP server to convert DocSend documents to PDF directly from Claude, Cursor, Copilot, Windsurf, and other AI assistants.",
  alternates: {
    canonical: "https://docsend2pdf.app/mcp",
  },
  openGraph: {
    title: "DocSend to PDF MCP Server",
    description:
      "Convert DocSend documents to PDF from any MCP-compatible AI assistant. Works with Claude, Cursor, Copilot, Windsurf, and more.",
    url: "https://docsend2pdf.app/mcp",
  },
};

const CONFIG_SNIPPET = `{
  "mcpServers": {
    "docsend-scraper": {
      "command": "node",
      "args": ["docsend-scraper-mcp"]
    }
  }
}`;

const clients: {
  name: string;
  icon: string;
  configPath: string;
  configPathWin?: string;
  notes?: string;
}[] = [
  {
    name: "Claude Desktop",
    icon: "C",
    configPath: "~/Library/Application Support/Claude/claude_desktop_config.json",
    configPathWin: "%APPDATA%\\Claude\\claude_desktop_config.json",
  },
  {
    name: "Claude Code",
    icon: "CC",
    configPath: "~/.claude/settings.json",
    configPathWin: "%USERPROFILE%\\.claude\\settings.json",
    notes: "Add under the \"mcpServers\" key in your existing settings file.",
  },
  {
    name: "Cursor",
    icon: "Cu",
    configPath: "~/.cursor/mcp.json",
    configPathWin: "%USERPROFILE%\\.cursor\\mcp.json",
  },
  {
    name: "Windsurf",
    icon: "W",
    configPath: "~/.codeium/windsurf/mcp_config.json",
    configPathWin: "%USERPROFILE%\\.codeium\\windsurf\\mcp_config.json",
  },
  {
    name: "VS Code (Copilot)",
    icon: "VS",
    configPath: ".vscode/mcp.json",
    notes: "Add to your workspace or user settings. Requires GitHub Copilot agent mode.",
  },
  {
    name: "Cline (VS Code)",
    icon: "Cl",
    configPath: "Cline Settings → MCP Servers → Configure",
    notes: "Open Cline sidebar → Settings gear → MCP Servers → Edit Config.",
  },
  {
    name: "Continue",
    icon: "Co",
    configPath: "~/.continue/config.json",
    configPathWin: "%USERPROFILE%\\.continue\\config.json",
    notes: "Add under \"experimental\" → \"modelContextProtocolServers\".",
  },
  {
    name: "OpenAI Codex CLI",
    icon: "Ox",
    configPath: "~/.codex/config.toml",
    configPathWin: "%USERPROFILE%\\.codex\\config.toml",
    notes: "MCP support varies by version. Check Codex CLI docs for current syntax.",
  },
];

function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <div className="relative group">
      {label && (
        <div className="text-[10px] font-mono text-muted px-3 pt-2 uppercase tracking-wider">
          {label}
        </div>
      )}
      <pre className="bg-card border border-border rounded-lg px-4 py-3 text-sm font-mono text-foreground overflow-x-auto whitespace-pre">
        {children}
      </pre>
    </div>
  );
}

export default function McpDocs() {
  const howToInstall = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Install the DocSend to PDF MCP Server",
    description:
      "Set up the DocSend to PDF MCP server to convert DocSend documents to PDF from any AI assistant like Claude, Cursor, or Copilot.",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Install the package",
        text: "Run npm install -g docsend-scraper-mcp to install the MCP server globally. This also installs Playwright and downloads Chromium (~150 MB) on first run.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Add to your client's config",
        text: 'Add the following JSON to your MCP client configuration file: {"mcpServers":{"docsend-scraper":{"command":"node","args":["docsend-scraper-mcp"]}}}',
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Restart your client",
        text: "Restart the application (Claude, Cursor, Copilot, etc.) for the MCP server to be detected.",
      },
    ],
  };

  const mcpFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What does the DocSend to PDF MCP server do?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It launches a headless browser, navigates to the DocSend link, captures each page as an image, and assembles them into a PDF. The PDF is saved to your Downloads folder.",
        },
      },
      {
        "@type": "Question",
        name: "Is anything stored on a server?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. The MCP server runs entirely on your local machine. No data is sent to any external server.",
        },
      },
      {
        "@type": "Question",
        name: "Why does the DocSend to PDF MCP server need Chromium?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "DocSend renders documents client-side with JavaScript. A real browser is needed to load the pages and extract the images.",
        },
      },
      {
        "@type": "Question",
        name: "How long does DocSend to PDF conversion take?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Typically 10-30 seconds depending on the number of pages and your internet connection. The first run may take longer due to browser startup.",
        },
      },
    ],
  };

  return (
    <>
      <JsonLd data={howToInstall} />
      <JsonLd data={mcpFaq} />
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-4 py-16">
          <nav aria-label="Breadcrumb">
            <Link
              href="/"
              className="text-sm text-accent hover:text-accent-dim transition-colors mb-8 inline-flex items-center gap-1"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
          </nav>

          <header className="mb-10">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              DocSend to PDF — MCP Server
            </h1>
            <p className="text-muted">
              Convert DocSend documents to PDF directly from any MCP-compatible AI
              assistant — Claude, Cursor, Copilot, Windsurf, and more.
            </p>
          </header>

          {/* Usage */}
          <section className="mb-12" aria-labelledby="usage-heading">
            <h2 id="usage-heading" className="text-lg font-medium text-foreground mb-4">Usage</h2>
            <p className="text-sm text-muted mb-4">
              Once configured, simply ask your AI assistant:
            </p>
            <div className="space-y-2 text-sm">
              <div className="bg-card border border-border rounded-lg px-4 py-2.5 font-mono text-foreground">
                &quot;Convert this DocSend to PDF: https://docsend.com/view/abc123&quot;
              </div>
              <div className="bg-card border border-border rounded-lg px-4 py-2.5 font-mono text-foreground">
                &quot;Save https://docsend.com/view/xyz789 with email me@company.com&quot;
              </div>
              <div className="bg-card border border-border rounded-lg px-4 py-2.5 font-mono text-foreground">
                &quot;Convert docsend.com/view/abc (passcode: secret123)&quot;
              </div>
            </div>
          </section>

          {/* Setup */}
          <section className="mb-12" aria-labelledby="setup-heading">
            <h2 id="setup-heading" className="text-lg font-medium text-foreground mb-4">Setup</h2>

            <div className="space-y-6">
              {/* Step 1 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-6 w-6 rounded-full bg-accent/20 text-accent text-xs font-semibold flex items-center justify-center" aria-hidden="true">
                    1
                  </span>
                  <h3 className="text-sm font-medium text-foreground">
                    Install the package
                  </h3>
                </div>
                <CodeBlock>npm install -g docsend-scraper-mcp</CodeBlock>
                <p className="text-xs text-muted mt-2">
                  This will also install Playwright and download Chromium (~150 MB) on first run.
                </p>
              </div>

              {/* Step 2 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-6 w-6 rounded-full bg-accent/20 text-accent text-xs font-semibold flex items-center justify-center" aria-hidden="true">
                    2
                  </span>
                  <h3 className="text-sm font-medium text-foreground">
                    Add to your client&apos;s config
                  </h3>
                </div>
                <CodeBlock label="JSON config">{CONFIG_SNIPPET}</CodeBlock>
              </div>

              {/* Step 3 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-6 w-6 rounded-full bg-accent/20 text-accent text-xs font-semibold flex items-center justify-center" aria-hidden="true">
                    3
                  </span>
                  <h3 className="text-sm font-medium text-foreground">
                    Restart your client
                  </h3>
                </div>
                <p className="text-sm text-muted">
                  Restart the application for the MCP server to be detected.
                </p>
              </div>
            </div>
          </section>

          {/* Client-specific paths */}
          <section className="mb-12" aria-labelledby="configs-heading">
            <h2 id="configs-heading" className="text-lg font-medium text-foreground mb-4">
              Config file locations
            </h2>
            <div className="space-y-3">
              {clients.map((c) => (
                <div
                  key={c.name}
                  className="bg-card border border-border rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-6 w-6 rounded bg-accent/15 text-accent text-[10px] font-bold flex items-center justify-center shrink-0" aria-hidden="true">
                      {c.icon}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {c.name}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted shrink-0 mt-0.5 w-12">macOS</span>
                      <code className="text-xs font-mono text-foreground break-all">
                        {c.configPath}
                      </code>
                    </div>
                    {c.configPathWin && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-muted shrink-0 mt-0.5 w-12">Win</span>
                        <code className="text-xs font-mono text-foreground break-all">
                          {c.configPathWin}
                        </code>
                      </div>
                    )}
                  </div>
                  {c.notes && (
                    <p className="text-xs text-muted mt-2">{c.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Tool reference */}
          <section className="mb-12" aria-labelledby="tool-heading">
            <h2 id="tool-heading" className="text-lg font-medium text-foreground mb-4">
              Tool reference
            </h2>
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-mono font-medium text-accent mb-3">
                convert_docsend_to_pdf
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted">
                    <th className="pb-2 font-medium w-24">Parameter</th>
                    <th className="pb-2 font-medium w-16">Required</th>
                    <th className="pb-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  <tr className="border-t border-border">
                    <td className="py-2 font-mono text-xs">url</td>
                    <td className="py-2 text-xs">Yes</td>
                    <td className="py-2 text-xs text-muted">
                      DocSend URL (e.g. https://docsend.com/view/abc123)
                    </td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="py-2 font-mono text-xs">email</td>
                    <td className="py-2 text-xs">No</td>
                    <td className="py-2 text-xs text-muted">
                      Email address if the document is email-gated
                    </td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="py-2 font-mono text-xs">passcode</td>
                    <td className="py-2 text-xs">No</td>
                    <td className="py-2 text-xs text-muted">
                      Passcode if the document is password-protected
                    </td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="py-2 font-mono text-xs">outputPath</td>
                    <td className="py-2 text-xs">No</td>
                    <td className="py-2 text-xs text-muted">
                      Custom save path. Defaults to ~/Downloads/&lt;title&gt;.pdf
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQ */}
          <section aria-labelledby="mcp-faq-heading">
            <h2 id="mcp-faq-heading" className="text-lg font-medium text-foreground mb-4">FAQ</h2>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-medium text-foreground">
                  What does the MCP server do?
                </dt>
                <dd className="text-muted mt-0.5">
                  It launches a headless browser, navigates to the DocSend link,
                  captures each page as an image, and assembles them into a PDF.
                  The PDF is saved to your Downloads folder.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">
                  Is anything stored on a server?
                </dt>
                <dd className="text-muted mt-0.5">
                  No. The MCP server runs entirely on your local machine. No data
                  is sent to any external server.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">
                  Why does it need Chromium?
                </dt>
                <dd className="text-muted mt-0.5">
                  DocSend renders documents client-side with JavaScript. A real
                  browser is needed to load the pages and extract the images.
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">
                  How long does it take?
                </dt>
                <dd className="text-muted mt-0.5">
                  Typically 10-30 seconds depending on the number of pages and
                  your internet connection. The first run may take longer due to
                  browser startup.
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
