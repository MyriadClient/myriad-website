"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { codeFromLocation, safeColor, safeLook, type Look, type Share, type ShareModule, type SettingRow } from "@/lib/share";

type State =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "error"; message: string }
  | { kind: "ready"; code: string; share: Share };

/** The default look: Myriad's own theme, for shares that don't carry one. */
const MYRIAD: Required<Look> = {
  accent: "#7FD8AEFF",
  secondary: "#4FA884FF",
  window: "#131514F0",
  title: "#0C0C0CB0",
  surface: "#252A2760",
  text: "#E9EEEBFF",
  textDim: "#8C9690FF",
  border: "#30363380",
  rounding: 4,
};

/**
 * A shared config drawn close to how it looks in Myriad: one window per addon and category, its modules as rows (on
 * ones tinted), each module's settings as they were set, in the sharer's colours. Private settings say only that
 * they're there.
 */
export function ConfigViewer({ api }: { api: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    // Every state change comes from the promise, after the effect: none while it runs.
    const code = codeFromLocation(window.location);
    const load = code ? fetchShare(api, code) : Promise.resolve(null);
    load
      .then((share) => {
        if (!code || !share) return setState({ kind: "missing" });
        setState({ kind: "ready", code, share });
        document.title = `${share.title} · Shared config · Myriad`;
      })
      .catch((e: Error) => setState({ kind: "error", message: e.message || "Couldn't reach Myriad's API." }));
  }, [api]);

  if (state.kind === "loading") return <Notice title="Loading the share…" />;
  if (state.kind === "missing") {
    return (
      <Notice title="No share code here">
        Shared configs have addresses like <code className="font-mono text-mint">/config/myriad_JS3k4d</code>. Make one
        in Myriad&apos;s <strong>Share</strong> window. <Link className="text-mint hover:underline" href="/docs/use/sharing">How sharing works</Link>
      </Notice>
    );
  }
  if (state.kind === "error") return <Notice title="Couldn't show this share">{state.message}</Notice>;
  return <ShareView code={state.code} share={state.share} />;
}

async function fetchShare(api: string, code: string): Promise<Share> {
  const r = await fetch(`${api}/v1/configs/${code}`);
  if (r.status === 404) throw new Error("There's no share with that code. It may have been deleted.");
  if (!r.ok) throw new Error(`Myriad's API answered ${r.status}.`);
  return (await r.json()) as Share;
}

function Notice({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl py-24 text-center">
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      {children && <p className="mt-3 text-dim">{children}</p>}
    </div>
  );
}

function ShareView({ code, share }: { code: string; share: Share }) {
  const look = { ...MYRIAD, ...safeLook(share.theme?.view ?? share.look) };
  const [onlyChanged, setOnlyChanged] = useState(true);
  const windows = useMemo(() => groupIntoWindows(share.modules), [share.modules]);
  const vars = {
    "--s-accent": look.accent,
    "--s-window": look.window,
    "--s-title": look.title,
    "--s-surface": look.surface,
    "--s-text": look.text,
    "--s-dim": look.textDim,
    "--s-border": look.border,
    "--s-round": `${Math.min(look.rounding, 10) * 2}px`,
  } as CSSProperties;

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-dim">Shared Myriad config</p>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">{share.title}</h1>
          {share.description && <p className="mt-2 max-w-2xl text-dim">{share.description}</p>}
          <p className="mt-3 flex flex-wrap gap-2 text-xs text-dim">
            {share.made?.core && <Chip>Myriad {share.made.core}</Chip>}
            {share.made?.minecraft && <Chip>Minecraft {share.made.minecraft}</Chip>}
            {(share.addons ?? []).map((a) => (
              <Chip key={a.id}>
                {a.name} {a.version}
              </Chip>
            ))}
          </p>
        </div>
        <TakeIn code={code} />
      </section>

      {windows.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">
              {share.modules.length} module{share.modules.length === 1 ? "" : "s"}
            </h2>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-dim">
              <input type="checkbox" className="accent-[var(--mint)]" checked={onlyChanged} onChange={(e) => setOnlyChanged(e.target.checked)} />
              Only settings that differ from the defaults
            </label>
          </div>
          <div className="share-menu grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3" style={vars}>
            {windows.map((w) => (
              <ShareWindow key={w.key} title={w.title} subtitle={w.addonName} color={w.color} modules={w.modules} onlyChanged={onlyChanged} />
            ))}
          </div>
        </section>
      )}

      {(share.controlPanels ?? []).length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-xl font-semibold">Control panels</h2>
          <div className="share-menu grid gap-4 md:grid-cols-2" style={vars}>
            {share.controlPanels!.map((p) => (
              <div key={p.name} className="share-window p-4">
                <p className="font-semibold" style={{ color: "var(--s-text)" }}>{p.name}</p>
                {p.description && <p className="text-sm" style={{ color: "var(--s-dim)" }}>{p.description}</p>}
                <p className="mt-2 flex flex-wrap gap-1.5">
                  {(p.members ?? []).map((m) => (
                    <span key={m} className="share-pill">{moduleName(share, m)}</span>
                  ))}
                </p>
                {Object.keys(p.settings ?? {}).length > 0 && (
                  <p className="mt-2 text-xs" style={{ color: "var(--s-dim)" }}>
                    Saves settings for {Object.keys(p.settings!).map((m) => moduleName(share, m)).join(", ")}.
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {share.theme && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-xl font-semibold">Theme{share.theme.name ? `: ${share.theme.name}` : ""}</h2>
          <div className="flex flex-wrap gap-3">
            {(["accent", "secondary", "window", "surface", "text", "textDim", "border"] as const).map((k) => (
              <div key={k} className="flex items-center gap-2 text-sm text-dim">
                <span className="h-6 w-6 rounded-md border border-line-strong" style={{ background: look[k] }} />
                {k === "textDim" ? "dim text" : k}
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="text-sm text-dim">
        Settings an addon marks private (webhooks, coordinates, passwords) are never shared: they show as{" "}
        <span className="text-ink">private</span>. <Link className="text-mint hover:underline" href="/docs/use/sharing">How sharing works</Link>
      </p>
    </div>
  );
}

function TakeIn({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-raised p-4 text-sm sm:max-w-sm">
      <div className="flex items-center justify-between gap-3">
        <code className="font-mono text-base text-mint">{code}</code>
        <button onClick={copy} className="rounded-md border border-line-strong px-2.5 py-1 text-ink transition-colors hover:border-mint hover:text-mint">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="text-dim">
        In game, open <strong className="text-ink">Share</strong> from the launcher and paste it, or type{" "}
        <code className="font-mono text-ink">.share try {code}</code> to try it as a control panel.
      </p>
    </div>
  );
}

interface WindowGroup {
  key: string;
  title: string;
  addonName: string;
  color?: string;
  modules: ShareModule[];
}

/** Modules grouped like the menu's windows: one per addon and category. */
function groupIntoWindows(modules: ShareModule[]): WindowGroup[] {
  const groups = new Map<string, WindowGroup>();
  for (const m of modules) {
    const category = m.view?.category?.name ?? "Modules";
    const addonName = m.view?.addonName ?? m.id.split(":")[0]!;
    const key = `${category}·${addonName}`;
    if (!groups.has(key)) groups.set(key, { key, title: category, addonName, color: safeColor(m.view?.category?.color), modules: [] });
    groups.get(key)!.modules.push(m);
  }
  return [...groups.values()];
}

function moduleName(share: Share, id: string): string {
  return share.modules.find((m) => m.id === id)?.view?.name ?? id.split(":")[1]?.replace(/_/g, " ") ?? id;
}

function ShareWindow({ title, subtitle, color, modules, onlyChanged }: {
  title: string;
  subtitle: string;
  color?: string;
  modules: ShareModule[];
  onlyChanged: boolean;
}) {
  return (
    <div className="share-window overflow-hidden">
      <div className="share-title flex items-center gap-2 px-3 py-2 text-sm">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color ?? "var(--s-accent)" }} />
        <span className="font-semibold" style={{ color: "var(--s-text)" }}>{title}</span>
        <span style={{ color: "var(--s-dim)" }}>{subtitle}</span>
      </div>
      <div className="flex flex-col gap-1.5 p-2">
        {modules.map((m) => (
          <ModuleCard key={m.id} module={m} color={color} onlyChanged={onlyChanged} />
        ))}
      </div>
    </div>
  );
}

function ModuleCard({ module: m, color, onlyChanged }: { module: ShareModule; color?: string; onlyChanged: boolean }) {
  const [open, setOpen] = useState(true);
  const groups = (m.view?.groups ?? [])
    .map((g) => ({ ...g, settings: g.settings.filter((s) => !onlyChanged || s.default === false || s.protected) }))
    .filter((g) => g.settings.length > 0);
  return (
    <div className="share-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm"
        title={m.view?.description}
        style={{ color: m.enabled ? "var(--s-text)" : "var(--s-dim)" }}
      >
        <span className="h-4 w-0.5 rounded-full" style={{ background: m.enabled ? color ?? "var(--s-accent)" : "transparent" }} />
        <span className="flex-1">{m.view?.name ?? m.id}</span>
        {!m.enabled && <span className="text-xs" style={{ color: "var(--s-dim)" }}>off</span>}
        <span className="text-xs" style={{ color: "var(--s-dim)" }}>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 px-3 pb-2.5 pt-0.5">
          {groups.length === 0 && <p className="text-xs" style={{ color: "var(--s-dim)" }}>All settings at their defaults.</p>}
          {groups.map((g) => (
            <div key={g.name} className="flex flex-col gap-1">
              {(m.view?.groups?.length ?? 0) > 1 && <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--s-dim)" }}>{g.name}</p>}
              {g.settings.map((s) => (
                <Setting key={s.name} row={s} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Setting({ row }: { row: SettingRow }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]" title={row.description}>
      <span style={{ color: "var(--s-text)" }}>{row.name}</span>
      <Value row={row} />
    </div>
  );
}

function Value({ row }: { row: SettingRow }) {
  if (row.protected) return <span className="share-pill" title="Private: never shared">🔒 private</span>;
  switch (row.kind) {
    case "toggle": {
      const on = row.value === true;
      return (
        <span className="share-switch" data-on={on} aria-label={on ? "on" : "off"}>
          <span />
        </span>
      );
    }
    case "number": {
      const v = Number(row.value);
      const min = row.min ?? 0, max = row.max ?? 1;
      const t = max > min ? Math.min(1, Math.max(0, (v - min) / (max - min))) : 0;
      return (
        <span className="flex items-center gap-2">
          <span className="share-slider"><span style={{ width: `${t * 100}%` }} /></span>
          <span className="w-12 text-right font-mono" style={{ color: "var(--s-text)" }}>{row.shown}</span>
        </span>
      );
    }
    case "color":
      return (
        <span className="flex items-center gap-1.5 font-mono text-xs" style={{ color: "var(--s-dim)" }}>
          <span className="h-3.5 w-3.5 rounded" style={{ background: safeColor(row.color), border: "1px solid var(--s-border)" }} />
          {safeColor(row.color)?.slice(0, 7)}
        </span>
      );
    case "keybind":
      return <kbd>{row.shown || "none"}</kbd>;
    case "choice":
      return <span className="share-pill">{row.shown}</span>;
    default:
      return (
        <span className="max-w-[55%] truncate font-mono text-xs" style={{ color: "var(--s-dim)" }} title={row.shown}>
          {row.shown || "(empty)"}
        </span>
      );
  }
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-line-strong px-2 py-0.5">{children}</span>;
}
