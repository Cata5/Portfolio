/**
 * Certifications — real certificates, stored as PDFs under public/certificates
 * with a WebP poster render for the cards (click opens the PDF). Titles are
 * the certificate names as printed on the documents; issuer/year/tags are
 * verbatim from the old portfolio's certificates page.
 */

export type Certification = {
  id: string;
  title: string;
  subtitle: string;
  issuer: string;
  year: string;
  tags: string[];
  /** WebP poster generated from the PDF's first page. */
  poster: string;
  /** The original document. */
  file: string;
};

export const certifications: Certification[] = [
  {
    id: "ccna",
    title: "CCNA 1",
    subtitle: "Introduction to Networks",
    issuer: "Cisco Networking Academy",
    year: "2024",
    tags: ["Networking", "TCP/IP", "Routing", "Switching"],
    poster: "/certificates/ccna.webp",
    file: "/certificates/ccna.pdf",
  },
  {
    id: "ic3",
    title: "IC3 GS6",
    subtitle: "Digital Literacy Certification",
    issuer: "Certiport",
    year: "2025",
    tags: ["Computing Fundamentals", "Key Applications", "Living Online"],
    poster: "/certificates/ic3.webp",
    file: "/certificates/ic3.pdf",
  },
];
