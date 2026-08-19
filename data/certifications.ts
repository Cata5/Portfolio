import certificationsJson from "@/content/certifications.json";

export type Certification = {
  id: string;
  title: string;
  subtitle: string;
  issuer: string;
  year: string;
  tags: string[];
  poster: string;
  file: string;
};

export const certifications: Certification[] = certificationsJson as Certification[];

