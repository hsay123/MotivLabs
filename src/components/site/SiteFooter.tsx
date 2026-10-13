import Link from "next/link";
import { brand, footerColumns, legalLinks } from "@/lib/content/site";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "./Wordmark";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-canvas">
      <Container size="default" className="py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
          <div className="max-w-sm">
            <Wordmark />
            <p className="mt-4 text-body-sm text-ink-3">{brand.tagline}</p>
            <p className="mt-6 max-w-xs text-caption text-ink-4">
              Zeno is currently in a pilot stage. Nothing on this site
              describes a customer relationship, certification or payment that
              has not been verified.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.heading}>
                <h2 className="text-body-sm font-medium text-ink">{column.heading}</h2>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="link-quiet text-body-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption text-ink-4">
            © {year} Zeno. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-5">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="link-quiet text-caption">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/contact" className="link-quiet text-caption">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </Container>
    </footer>
  );
}
