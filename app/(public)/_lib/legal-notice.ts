/**
 * Publisher details for `/mentions-legales`.
 *
 * French law requires a publication director and a phone number. Until both
 * are filled in, the page returns 404 and no link points to it, so an
 * incomplete legal notice is never published.
 */
export const LEGAL_NOTICE = {
  publisher: "INCACOOK LLC",
  legalForm: "Limited Liability Company",
  registration: "État du Wyoming (États-Unis), n° 37-2239332",
  headOffice: "30 N Gould St, Ste R, Sheridan, WY 82801, États-Unis",
  email: "contact@incacook.com",
  publicationDirector: "",
  phone: "",
  host: {
    name: "Vercel Inc.",
    address: "440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis",
    website: "https://vercel.com",
  },
};

export function isLegalNoticeComplete(
  notice: Pick<typeof LEGAL_NOTICE, "publicationDirector" | "phone"> = LEGAL_NOTICE,
): boolean {
  return notice.publicationDirector.trim() !== "" && notice.phone.trim() !== "";
}

/** The legal navigation shared by the site footer and the legal page shell. */
export const LEGAL_PAGE_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/privacy", label: "Confidentialité" },
  { href: "/terms", label: "Conditions" },
  { href: "/data-deletion", label: "Suppression des données" },
  ...(isLegalNoticeComplete() ? [{ href: "/mentions-legales", label: "Mentions légales" }] : []),
];
