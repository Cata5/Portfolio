import journeyJson from "@/content/journey.json";

export type JourneyCategory = "main" | "competitions" | "community" | "side";

export type JourneyEntry = {
  date: string;
  category: JourneyCategory;
  title: string;
  note: string;
  tags?: string[];
  image?: string;
  link?: string;
  location?: string;
  type?: string;
};

export const journey: JourneyEntry[] = journeyJson as JourneyEntry[];
