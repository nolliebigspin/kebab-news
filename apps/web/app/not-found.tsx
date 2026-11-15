import Link from "next/link";
import { LogoMark } from "@/components/brand/Logo";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container width="prose" className="py-20 sm:py-28">
      <LogoMark className="size-14 text-ink" />
      <h1 className="mt-8 font-display text-display">Diese Seite gibt es nicht.</h1>
      <p className="mt-4 text-ink-soft text-lede">
        Der Link ist veraltet oder falsch geschrieben. Ältere Artikel findest du im Archiv, laufende
        Themen in der Themenübersicht.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" nativeButton={false} render={<Link href="/artikel">Zum Archiv</Link>} />
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          render={<Link href="/themen">Themen ansehen</Link>}
        />
      </div>
    </Container>
  );
}
