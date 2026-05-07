import { redirect } from "next/navigation";
import { normalizeLocale } from "../../../lib/i18n";

// Map page is redundant in V3 — the Live (/) page is itself the
// operational map. Keep this route around as a redirect so any old
// bookmarks or external links still land somewhere useful.
export default async function MapPage({ params }) {
  const resolvedParams = await params;
  const locale = normalizeLocale(resolvedParams.lang);
  redirect(`/${locale}`);
}
