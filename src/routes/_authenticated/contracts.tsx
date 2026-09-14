import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { MobileShell } from "@/components/mobile-shell";
import { StatusPill } from "@/components/status-pill";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/contracts")({
  component: ContractsPage,
});

const FILTERS = ["all", "pending", "funded", "sent_back"] as const;
type Filter = (typeof FILTERS)[number];

function filterLabel(f: Filter) {
  return f === "all" ? "All" : f === "sent_back" ? "Sent Back" : f[0].toUpperCase() + f.slice(1);
}

function ContractsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const navigate = useNavigate({ from: "/contracts" });

  const { data, isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Record<string, any>[];
    },
  });

  const { data: dealerNames } = useQuery({
    queryKey: ["dealer-names"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dealers").select("*").limit(500);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const d of (data ?? []) as Record<string, any>[]) {
        const name =
          d.name ?? d.dealer_name ?? d.business_name ?? d.legal_name ?? d.company_name;
        if (d.id != null && name) map[String(d.id)] = String(name);
      }
      return map;
    },
  });

  const dealerLabel = (c: Record<string, any>) => {
    const id = c.dealer_id ?? c.dealer ?? c.dealerId;
    const fromTable = id != null ? dealerNames?.[String(id)] : undefined;
    return (
      c.dealer_name ??
      fromTable ??
      (id != null ? String(id) : "Unknown dealer")
    );
  };

  const byStatus = (data ?? []).filter((c) =>
    filter === "all" ? true : String(c.status ?? "").toLowerCase() === filter,
  );

  const filtered = byStatus.filter((c) => {
    if (!q) return true;
    const needle = q.toLowerCase();
    return [c.contract_number, dealerLabel(c)]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(needle));
  });

  return (
    <MobileShell title="Contracts">
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by dealer or contract #"
          className="h-11 w-full rounded-xl bg-surface pl-11 pr-4 text-sm outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter contracts by status">
        {FILTERS.map((f) => {
          const label = filterLabel(f);
          const selected = filter === f;
          return (
            <button
              key={f}
              id={`filter-chip-${f}`}
              type="button"
              aria-label={label}
              aria-pressed={selected}
              data-selected={selected ? "true" : "false"}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                selected
                  ? "bg-foreground text-background ring-2 ring-primary/40"
                  : "bg-surface text-muted-foreground ring-1 ring-black/5"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="divide-y divide-black/5 rounded-[20px] bg-surface ring-1 ring-black/5">
        {isLoading && (
          <div className="p-6 text-center text-sm text-muted-foreground">Loading contracts…</div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No contracts match.
          </div>
        )}
        {filtered.map((c) => (
          <button
            key={c.id}
            id={`contract-row-${c.contract_number ?? c.id}`}
            type="button"
            aria-label={`Open contract ${c.contract_number ?? c.id}`}
            onClick={() =>
              navigate({
                to: "/contracts/$id",
                params: { id: String(c.id) },
              })
            }
            className="flex w-full items-center justify-between gap-3 p-4 text-left transition active:bg-black/[.02]"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{dealerLabel(c)}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {c.contract_number ?? String(c.id).slice(0, 8)}
                {c.amount != null ? ` • ${formatCurrency(Number(c.amount))}` : ""}
              </p>
            </div>
            <StatusPill status={c.status ?? "pending"} />
          </button>
        ))}
      </div>
    </MobileShell>
  );
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
