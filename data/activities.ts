import activitiesJson from "@/content/activities.json";

export type Activity = {
  id: string;
  type: string;
  year: string;
  location: string;
  title: string;
  description: string;
  link?: string;
  image?: string;
};

export const activities: Activity[] = activitiesJson as Activity[];

