import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  /*
   * Emit each route as a directory with an index.html.
   *
   * Azure Storage static websites have no rewrite rules: they serve a blob at
   * the exact path or return the 404 document. Without this, /explore is a 404
   * and only /explore.html resolves — which is not the URL in our canonical
   * tag, our sitemap, or any link anyone would share.
   */
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  /*
   * The dev overlay badge sits bottom left, directly on top of the slide
   * counter, which makes the one corner we need to read unreadable while
   * working on the canvas. It never ships, but it is in the way here.
   */
  devIndicators: false,
};

export default nextConfig;
