import Link from "next/link";

/**
 * App footer — shown on all authenticated pages.
 */
export function Footer() {
  return (
    <footer className="shrink-0 border-t border-border bg-background px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between text-xs text-muted-foreground">
        <span>© 2026 PermaBrasilis • PermaDesigner</span>
        <div className="flex gap-4">
          <Link href="/privacidade" className="hover:text-foreground transition-colors">
            Privacidade
          </Link>
          <a
            href="https://github.com/catitodev/permadesigner"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
