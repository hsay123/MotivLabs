import { ProductShell } from "@/components/product/ProductShell";

/**
 * Authenticated product layout.
 *
 * Route group `(product)` keeps clean URLs (`/workspace/...`) while
 * giving the application its own dense shell — separate from the
 * marketing chrome in `(marketing)`.
 */
export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProductShell>{children}</ProductShell>;
}
