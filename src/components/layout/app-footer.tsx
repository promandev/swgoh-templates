import { version } from "../../../package.json";

/**
 * Small global footer: the running app version and attribution. Rendered as a
 * server component so `package.json` stays out of the client bundle — only the
 * version string is serialized.
 */
export function AppFooter() {
  return (
    <footer className="border-t border-border/40 py-1.5">
      <p className="text-center text-xs text-muted-foreground">
        v{version} · by makario85
      </p>
    </footer>
  );
}
