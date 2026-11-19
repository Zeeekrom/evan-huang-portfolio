/**
 * /explore needs its own copy of the share card.
 *
 * The route defines its own `openGraph` block for the title and description,
 * and doing so replaces the parent's rather than merging into it — which
 * silently dropped the image from the one URL anyone actually shares.
 * Declaring the file here re-attaches it; the artwork itself is not
 * duplicated, only re-exported.
 *
 * `dynamic` is declared literally rather than re-exported: route segment
 * config has to be statically analysable, and a re-export fails the build.
 */
export const dynamic = "force-static";

export { default, size, contentType, alt } from "../opengraph-image";
