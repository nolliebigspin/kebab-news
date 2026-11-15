"use client";

import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container width="prose" className="py-20 sm:py-28">
      <h1 className="font-display text-display">Diese Seite konnte nicht geladen werden.</h1>
      <p className="mt-4 text-ink-soft text-lede">
        Vermutlich ist die Datenbank gerade nicht erreichbar. Lade die Seite in einem Moment neu.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" onClick={reset}>
          Neu laden
        </Button>
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          render={<Link href="/">Zur Startseite</Link>}
        />
      </div>
    </Container>
  );
}
