import skillsJson from "@/content/skills.json";

export type SkillGroup = {
  label: string;
  note: string;
  items: string[];
};

export const skillGroups: SkillGroup[] = skillsJson.skillGroups;
export const focusAreas: { label: string; note: string }[] = skillsJson.focusAreas;

