import { createFileRoute, Link } from "@tanstack/react-router";
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

function ContractsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["contracts", filter],
    queryFn: async () => {
      let query = supabase
        .from("contracts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (data ?? []).filter((c: any) => {
    if (!q) return true;
    const needle = q.toLowerCase();
    return [c.contract_number, c.dealer_name, c.dealer]
      .filter(Boolean)
      .some((v: string) => String(v).toLowerCase().includes(needle));
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

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
              filter === f
                ? "bg-foreground text-background"
                : "bg-surface text-muted-foreground ring-1 ring-black/5"
            }`}
          >
            {f === "all" ? "All" : f === "sent_back" ? "Sent Back" : f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
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
        {filtered.map((c: any) => (
          <Link
            key={c.id}
            to="/contracts/$id"
            params={{ id: String(c.id) }}
            className="flex items-center justify-between gap-3 p-4 transition active:bg-black/[.02]"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {c.dealer_name ?? c.dealer ?? "Unknown dealer"}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {c.contract_number ?? String(c.id).slice(0, 8)}
                {c.amount != null ? ` • ${formatCurrency(Number(c.amount))}` : ""}
              </p>
            </div>
            <StatusPill status={c.status ?? "pending"} />
          </Link>
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
