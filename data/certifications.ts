/**
 * Certifications — real certificates, stored as PDFs under public/certificates.
 * The section renders each one inline (browser PDF viewer) with an open-in-tab
 * fallback. Titles are the certificate names as printed on the documents.
 */

export type Certification = {
  id: string;
  title: string;
  subtitle: string;
  file: string;
};

export const certifications: Certification[] = [
  {
    id: "ccna",
    title: "CCNA",
    subtitle: "Cisco Certified Network Associate",
    file: "/certificates/ccna.pdf",
  },
  {
    id: "ic3",
    title: "IC3",
    subtitle: "Internet and Computing Core Certification",
    file: "/certificates/ic3.pdf",
  },
];
