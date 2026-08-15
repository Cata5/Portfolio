import { About } from "@/components/about/about";
import { Activities } from "@/components/activities/activities";
import { Certifications } from "@/components/certifications/certifications";
import { Contact } from "@/components/contact/contact";
import { Hero } from "@/components/hero/hero";
import { Journey } from "@/components/journey/journey";
import { MLNotebook } from "@/components/ml/ml-notebook";
import { FeaturedProjects } from "@/components/projects/featured-projects";
import { ProjectExplorer } from "@/components/projects/project-explorer";
import { Stack } from "@/components/stack/stack";
import { TriangleWorld } from "@/components/triangle-world";

export default function Home() {
  return (
    <>
      {/* The one triangle scene on the page. Fixed behind everything, it
          owns the material from the hero's Earth down to the final gather
          in Contact — every section shares the same pieces. */}
      <TriangleWorld />
      <div className="relative z-10">
        <Hero />
        <About />
        <FeaturedProjects />
        <ProjectExplorer />
        <Stack />
        <Certifications />
        <MLNotebook />
        <Journey />
        <Activities />
        <Contact />
      </div>
    </>
  );
}
