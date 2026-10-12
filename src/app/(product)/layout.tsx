import { SessionGate } from "@/lib/api/session";
import { ProductShell } from "@/components/product/ProductShell";

/**
 * Authenticated product layout.
 *
 * Route group `(product)` keeps clean URLs (`/workspace/...`) while
 * giving the application its own dense shell — separate from the
 * marketing chrome in `(marketing)`.
 *
 * `SessionGate` is the real gate: it redirects unauthenticated visitors to
 * `/login` and resolves the signed-in profile from `GET /api/me` before any
 * workspace screen renders.
 */
export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionGate>
      <ProductShell>{children}</ProductShell>
    </SessionGate>
  );
}
