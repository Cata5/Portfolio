import { SectionRenderer } from "@/components/section-renderer";
import { TriangleWorld } from "@/components/triangle-world";

export default function Home() {
  return (
    <>
      {/* The one triangle scene on the page. Fixed behind everything, it
          owns the material from the hero's Earth down to the final gather
          in Contact — every section shares the same pieces. */}
      <TriangleWorld />
      <SectionRenderer />
    </>
  );
}
