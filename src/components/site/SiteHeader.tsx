"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { headerActions, primaryNav, type NavGroup } from "@/lib/content/site";
import { cn } from "@/lib/utils/cn";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRight, ChevronDown, Close, Menu } from "@/components/ui/icons";
import { Wordmark } from "./Wordmark";

/**
 * Site header.
 *
 * Desktop: a horizontal rail of disclosure menus plus the primary
 * actions. Dropdowns open on hover and on click/Enter, and close on
 * Escape or when the pointer leaves the group. Focus is deliberately not
 * used to open a menu — doing so would make the first click (or Enter)
 * immediately toggle the just-focused panel shut.
 *
 * Mobile: a single toggle opening a full-height panel of accordion
 * groups. The panel traps nothing, but closes on route change and
 * restores focus to the toggle.
 */
export function SiteHeader() {
  const pathname = usePathname();
  // Remount on navigation so an open menu is reset without an effect that
  // calls setState in response to the pathname.
  return <HeaderBar key={pathname} pathname={pathname} />;
}

function HeaderBar({ pathname }: { pathname: string }) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks whether the open menu was opened by hovering, so the first
  // click/tap that follows a hover keeps it open instead of toggling it
  // shut (touch devices fire mouseenter before click).
  const openedByHover = useRef(false);

  // Hairline border + stronger blur once the page scrolls under the bar.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape closes the open dropdown.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        openedByHover.current = false;
        setOpenGroup(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Prevent background scroll while the mobile panel is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenGroup(null), 140);
  };

  const isActive = (group: NavGroup) =>
    pathname === group.href || pathname.startsWith(`${group.href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-200",
        scrolled ? "backdrop-chrome border-line" : "border-transparent bg-canvas",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-container items-center gap-3 px-5 sm:h-[72px] sm:px-8 lg:px-10">
        <Wordmark />

        {/* ---- Desktop navigation ---------------------------------- */}
        <div
          ref={navRef}
          className="ml-4 hidden flex-1 items-center gap-0.5 lg:flex"
          onMouseLeave={() => {
            openedByHover.current = false;
            scheduleClose();
          }}
        >
          {primaryNav.map((group) => {
            const open = openGroup === group.label;
            const panelId = `nav-panel-${group.label.toLowerCase()}`;
            return (
              <div
                key={group.label}
                className="relative"
                onMouseEnter={() => {
                  cancelClose();
                  openedByHover.current = true;
                  setOpenGroup(group.label);
                }}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  aria-haspopup="true"
                  onClick={() => {
                    if (open && openedByHover.current) {
                      // The menu is already open from hover; keep it open.
                      openedByHover.current = false;
                      return;
                    }
                    openedByHover.current = false;
                    setOpenGroup(open ? null : group.label);
                  }}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-body-sm font-medium transition-colors",
                    open || isActive(group)
                      ? "bg-surface-muted text-ink"
                      : "text-ink-2 hover:bg-surface-muted hover:text-ink",
                  )}
                >
                  {group.label}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-ink-4 transition-transform duration-200",
                      open && "rotate-180",
                    )}
                  />
                </button>

                <div
                  id={panelId}
                  // Visibility is driven by state so keyboard focus can
                  // reach panel contents only while open.
                  hidden={!open}
                  className="absolute left-0 top-[calc(100%+6px)] w-[min(46rem,calc(100vw-3rem))] origin-top-left"
                >
                  <div className="overflow-hidden rounded-xl border border-line bg-surface p-2 shadow-[0_18px_40px_-24px_rgba(22,19,14,0.35)]">
                    <div className="grid gap-1 sm:grid-cols-2">
                      {group.columns.map((column) => (
                        <div key={column.heading} className="p-3">
                          <p className="px-2.5 pb-2 text-eyebrow uppercase text-ink-4">
                            {column.heading}
                          </p>
                          <ul className="space-y-0.5">
                            {column.links.map((link) => (
                              <li key={link.href}>
                                <NavItem link={link} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    {group.footnote ? (
                      <div className="mt-1 border-t border-line px-3 py-3">
                        <NavItem link={group.footnote} prominent />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}

          <Link
            href="/how-it-works"
            className={cn(
              "inline-flex h-9 items-center rounded-md px-3 text-body-sm font-medium transition-colors",
              pathname === "/how-it-works"
                ? "bg-surface-muted text-ink"
                : "text-ink-2 hover:bg-surface-muted hover:text-ink",
            )}
          >
            How it works
          </Link>
        </div>

        {/* ---- Desktop actions ------------------------------------- */}
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <Link
            href={headerActions.signIn.href}
            className="inline-flex h-9 items-center rounded-md px-3 text-body-sm font-medium text-ink-2 transition-colors hover:bg-surface-muted hover:text-ink"
          >
            {headerActions.signIn.label}
          </Link>
          <ButtonLink href={headerActions.explore.href} variant="secondary" size="md">
            {headerActions.explore.label}
          </ButtonLink>
          <ButtonLink href={headerActions.primary.href} variant="primary" size="md">
            {headerActions.primary.label}
          </ButtonLink>
        </div>

        {/* ---- Mobile toggle --------------------------------------- */}
        <button
          type="button"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md border border-line text-ink transition-colors hover:bg-surface-muted lg:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          onClick={() => setMobileOpen((value) => !value)}
        >
          <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
          {mobileOpen ? <Close className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <MobilePanel onNavigate={() => setMobileOpen(false)} pathname={pathname} />
      ) : null}
    </header>
  );
}

function NavItem({
  link,
  prominent = false,
}: {
  link: { label: string; href: string; description?: string; status?: string };
  prominent?: boolean;
}) {
  const planned = link.status === "planned";
  const body = (
    <>
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "text-body-sm font-medium",
            prominent ? "text-accent-700" : "text-ink",
          )}
        >
          {link.label}
        </span>
        {planned ? (
          <span className="rounded-full border border-line-strong px-2 py-0.5 text-[11px] font-medium text-ink-4">
            Planned
          </span>
        ) : null}
      </span>
      {link.description ? (
        <span className="mt-0.5 block text-caption text-ink-3">{link.description}</span>
      ) : null}
    </>
  );

  if (planned) {
    return (
      <div
        aria-disabled="true"
        className="block cursor-default rounded-md px-2.5 py-2 opacity-70"
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      href={link.href}
      className={cn(
        "block rounded-md px-2.5 py-2 transition-colors hover:bg-surface-muted",
        prominent && "hover:bg-accent-50",
      )}
    >
      {body}
    </Link>
  );
}

function MobilePanel({
  onNavigate,
  pathname,
}: {
  onNavigate: () => void;
  pathname: string;
}) {
  const [open, setOpen] = useState<string | null>(primaryNav[0]?.label ?? null);
  const baseId = useId();

  return (
    <div
      id="mobile-nav"
      className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-line bg-canvas lg:hidden"
    >
      <nav className="mx-auto w-full max-w-container px-5 py-4 sm:px-8">
        <ul className="divide-y divide-line">
          {primaryNav.map((group) => {
            const expanded = open === group.label;
            const panelId = `${baseId}-${group.label}`;
            return (
              <li key={group.label} className="py-1">
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setOpen(expanded ? null : group.label)}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-1 py-3 text-left"
                >
                  <span className="font-display text-[1.0625rem] font-medium text-ink">
                    {group.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-ink-4 transition-transform duration-200",
                      expanded && "rotate-180",
                    )}
                  />
                </button>
                <div id={panelId} hidden={!expanded} className="pb-2">
                  <Link
                    href={group.href}
                    onClick={onNavigate}
                    className="mb-1 flex items-center gap-1.5 rounded-md px-1 py-2 text-body-sm font-medium text-accent-700"
                  >
                    {group.label} overview
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  {group.columns.map((column) => (
                    <div key={column.heading} className="mt-2">
                      <p className="px-1 pb-1 text-eyebrow uppercase text-ink-4">
                        {column.heading}
                      </p>
                      <ul>
                        {column.links.map((link) => (
                          <li key={link.href}>
                            {link.status === "planned" ? (
                              <div
                                aria-disabled="true"
                                className="flex items-center justify-between gap-2 px-1 py-2 opacity-70"
                              >
                                <span className="text-body-sm text-ink">{link.label}</span>
                                <span className="rounded-full border border-line-strong px-2 py-0.5 text-[11px] text-ink-4">
                                  Planned
                                </span>
                              </div>
                            ) : (
                              <Link
                                href={link.href}
                                onClick={onNavigate}
                                className="block px-1 py-2 text-body-sm text-ink-2"
                              >
                                {link.label}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
          <li className="py-1">
            <Link
              href="/how-it-works"
              onClick={onNavigate}
              className={cn(
                "block rounded-md px-1 py-3 font-display text-[1.0625rem] font-medium",
                pathname === "/how-it-works" ? "text-accent-700" : "text-ink",
              )}
            >
              How it works
            </Link>
          </li>
        </ul>

        <div className="mt-6 flex flex-col gap-2 pb-10">
          <ButtonLink href={headerActions.primary.href} size="lg" onClick={onNavigate}>
            {headerActions.primary.label}
          </ButtonLink>
          <ButtonLink
            href={headerActions.explore.href}
            variant="secondary"
            size="lg"
            onClick={onNavigate}
          >
            {headerActions.explore.label}
          </ButtonLink>
          <Link
            href={headerActions.signIn.href}
            onClick={onNavigate}
            className="py-2 text-center text-body-sm font-medium text-ink-2"
          >
            {headerActions.signIn.label}
          </Link>
        </div>
      </nav>
    </div>
  );
}
