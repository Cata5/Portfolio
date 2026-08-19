import journeyJson from "@/content/journey.json";

export type JourneyCategory = "main" | "education" | "competitions" | "side";

export type JourneyEntry = {
  date: string;
  category: JourneyCategory;
  title: string;
  note: string;
  tags: string[];
};

export const journey: JourneyEntry[] = journeyJson as JourneyEntry[];

