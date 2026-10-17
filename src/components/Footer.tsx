import { footer, site } from "@/data/content";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto max-w-5xl px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
        <p>
          © {year} {site.name}
        </p>
        <p className="font-mono">{footer.builtWith}</p>
      </div>
    </footer>
  );
}
