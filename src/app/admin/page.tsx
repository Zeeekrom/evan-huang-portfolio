import type { Metadata } from "next";
import AdminPanel from "@/components/admin/AdminPanel";

/**
 * The admin panel: the notes visitors have left, and what is on the site.
 *
 * A static page like every other on this site — it holds no secret and needs
 * no server. The admin key is typed in once and kept in the browser, so the
 * page is useless to anyone who does not have it, and the key never travels
 * through the build or the repository.
 *
 * Kept out of the sitemap and told not to be indexed. It is not hidden — a
 * static site cannot hide a URL — it is simply uninteresting without the key.
 */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPanel />;
}
