import { About } from "@/components/about/about";
import { Apps } from "@/components/apps/apps";
import { Contact } from "@/components/contact/contact";
import { Hero } from "@/components/hero/hero";
import { Journey } from "@/components/journey/journey";
import { MLNotebook } from "@/components/ml/ml-notebook";
import { FeaturedProjects } from "@/components/projects/featured-projects";
import { ProjectExplorer } from "@/components/projects/project-explorer";
import { Stack } from "@/components/stack/stack";

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <FeaturedProjects />
      <ProjectExplorer />
      <Stack />
      <MLNotebook />
      <Apps />
      <Journey />
      <Contact />
    </>
  );
}
