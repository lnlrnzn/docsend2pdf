"use client";

import { useState, useEffect } from "react";

interface ScrapeFormProps {
  onSubmit: (data: {
    urls: string[];
    email?: string;
    passcode?: string;
  }) => void;
  isLoading: boolean;
  onSuccess?: boolean;
}

export function ScrapeForm({ onSubmit, isLoading, onSuccess }: ScrapeFormProps) {
  const [link, setLink] = useState("");
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const [showOptions, setShowOptions] = useState(true);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.userAgent.includes("Mac"));
  }, []);

  useEffect(() => {
    if (onSuccess) {
      setLink("");
    }
  }, [onSuccess]);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const url = link.trim();
    if (!url) return;
    onSubmit({
      urls: [url],
      email: email || undefined,
      passcode: passcode || undefined,
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="link"
          className="block text-sm font-medium text-muted mb-1.5"
        >
          DocSend Link
        </label>
        <div className="relative">
          <input
            id="link"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://docsend.com/view/..."
            className="w-full rounded-lg border border-border bg-card px-4 py-3 pr-9 font-mono text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          />
          {link.length > 0 && (
            <button
              type="button"
              onClick={() => setLink("")}
              className="absolute top-1/2 -translate-y-1/2 right-2.5 h-5 w-5 flex items-center justify-center rounded text-muted hover:text-foreground hover:bg-border/50 transition-colors text-xs"
              aria-label="Clear input"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowOptions(!showOptions)}
        className="text-sm text-accent hover:text-accent-dim transition-colors flex items-center gap-1"
      >
        <svg
          className={`w-4 h-4 transition-transform ${showOptions ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        Credentials
      </button>

      {showOptions && (
        <div className="space-y-3 pl-5 border-l-2 border-border">
          <p className="text-xs text-muted">
            Only needed if the document requires an email or passcode to view.
          </p>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-muted mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            />
          </div>
          <div>
            <label
              htmlFor="passcode"
              className="block text-sm font-medium text-muted mb-1"
            >
              Passcode
            </label>
            <input
              id="passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Document passcode"
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !link.trim()}
        className="w-full rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-background transition-all hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Scraping...
          </span>
        ) : (
          <>
            Scrape
            <kbd className="ml-1 text-xs opacity-60 font-mono">
              {isMac ? "⌘↩" : "Ctrl↩"}
            </kbd>
          </>
        )}
      </button>
    </form>
  );
}
