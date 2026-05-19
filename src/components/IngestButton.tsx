"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type OutletResult = {
  slug: string;
  newArticles: number;
  newStories: number;
  error?: string;
};

type IngestResponse = {
  runId: string;
  trigger: "manual" | "cron";
  outlets: number;
  newArticles: number;
  newStories: number;
  durationMs: number;
  results: OutletResult[];
};

type State =
  | { kind: "idle" }
  | { kind: "running"; startedAt: number }
  | { kind: "done"; response: IngestResponse }
  | { kind: "error"; message: string };

export function IngestButton() {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function trigger() {
    setState({ kind: "running", startedAt: Date.now() });
    try {
      const r = await fetch("/api/cron/ingest", { method: "POST" });
      if (!r.ok) {
        const body = await r.text();
        setState({ kind: "error", message: `HTTP ${r.status}: ${body.slice(0, 300)}` });
        return;
      }
      const response = (await r.json()) as IngestResponse;
      setState({ kind: "done", response });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="default"
          size="lg"
          nativeButton
          onClick={trigger}
          disabled={state.kind === "running"}
        >
          {state.kind === "running" ? "Lädt …" : "Jetzt Nachrichten holen"}
        </Button>
        {state.kind === "running" ? <RunningTimer startedAt={state.startedAt} /> : null}
      </div>

      {state.kind === "error" ? (
        <pre className="whitespace-pre-wrap rounded-md border border-warn bg-warn-wash p-4 font-mono text-ink text-sm leading-relaxed">
          {state.message}
        </pre>
      ) : null}

      {state.kind === "done" ? <ResultBlock response={state.response} /> : null}
    </div>
  );
}

function RunningTimer({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [startedAt]);
  return <span className="font-mono text-ink-mute text-sm">{elapsed}s</span>;
}

function ResultBlock({ response }: { response: IngestResponse }) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-line bg-bg-warm p-4">
        <div className="grid grid-cols-2 gap-3 font-mono text-sm sm:grid-cols-4">
          <Stat label="run" value={response.runId} mono />
          <Stat label="duration" value={`${(response.durationMs / 1000).toFixed(1)}s`} />
          <Stat label="new articles" value={String(response.newArticles)} />
          <Stat label="new stories" value={String(response.newStories)} />
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-line border-b text-left font-mono text-ink-mute text-xs uppercase tracking-[0.12em]">
            <th className="py-2 pr-4">Outlet</th>
            <th className="py-2 pr-4">Neue Artikel</th>
            <th className="py-2 pr-4">Neue Stories</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {response.results.map((r) => (
            <tr key={r.slug} className="border-line-soft border-b last:border-0">
              <td className="py-2 pr-4 font-medium">{r.slug}</td>
              <td className="py-2 pr-4 font-mono">{r.newArticles}</td>
              <td className="py-2 pr-4 font-mono">{r.newStories}</td>
              <td className="py-2">
                {r.error ? (
                  <span className="text-warn">error: {r.error}</span>
                ) : (
                  <span className="text-ink-mute">ok</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] text-ink-mute uppercase tracking-[0.12em]">{label}</div>
      <div className={mono ? "mt-1 truncate font-mono text-xs" : "mt-1 truncate"}>{value}</div>
    </div>
  );
}
