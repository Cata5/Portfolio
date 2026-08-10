import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/container";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-start justify-center py-24">
      <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-muted-foreground">
        404
      </p>
      <h1 className="mt-4 text-3xl font-medium tracking-tight md:text-4xl">
        Page not found.
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist — it may have moved
        or never been built.
      </p>
      <Link
        href="/"
        className="group mt-8 inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-signal"
      >
        <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        back home
      </Link>
    </Container>
  );
}
