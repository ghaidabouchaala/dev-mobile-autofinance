import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { MobileShell } from "@/components/mobile-shell";
import { StatusPill } from "@/components/status-pill";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

type ContractRow = Record<string, any>;

function DashboardPage() {
  const { user, signOut } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [contracts, dealers, recent] = await Promise.all([
        supabase.from("contracts").select("id, status, amount", { count: "exact", head: false }),
        supabase.from("dealers").select("id", { count: "exact", head: true }),
        supabase
          .from("contracts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      return {
        contractsCount: contracts.count ?? contracts.data?.length ?? 0,
        contracts: (contracts.data ?? []) as ContractRow[],
        dealersCount: dealers.count ?? 0,
        recent: (recent.data ?? []) as ContractRow[],
      };
    },
  });

  const totalValue = (data?.contracts ?? []).reduce(
    (sum, c) => sum + (Number(c.amount) || 0),
    0,
  );
  const pending = (data?.contracts ?? []).filter(
    (c) => String(c.status ?? "").toLowerCase() === "pending",
  ).length;
  const docsPending = pending; // proxy metric until we join a documents table

  const first =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "there";

  return (
    <MobileShell
      title={undefined}
      right={
        <button
          onClick={() => signOut()}
          className="grid size-9 place-items-center rounded-full bg-surface text-muted-foreground ring-1 ring-black/5 transition active:scale-95"
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
        </button>
      }
    >
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Welcome, {first}</p>
          <h1 className="text-xl font-semibold">Funding Dashboard</h1>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[20px] bg-primary p-4 shadow-sm ring-1 ring-black/5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-blue-100">
            Total Contracts
          </p>
          <h3 className="mt-1 text-lg font-semibold text-primary-foreground">
            {isLoading ? "—" : data?.contractsCount ?? 0}
          </h3>
          <p className="mt-0.5 text-xs font-medium text-blue-100/80">
            {isLoading ? "—" : formatCurrency(totalValue)} total value
          </p>
        </div>
        <KpiCard label="Active Dealers" value={data?.dealersCount ?? 0} loading={isLoading} />
        <KpiCard label="Pending Pay" value={pending} loading={isLoading} />
        <KpiCard
          label="Docs Required"
          value={docsPending}
          loading={isLoading}
          valueClassName={docsPending > 0 ? "text-destructive" : undefined}
        />
      </div>

      {/* Recent Contracts */}
      <section className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent Contracts</h3>
          <Link to="/contracts" className="text-xs font-medium text-primary">
            View All
          </Link>
        </div>

        <div className="divide-y divide-black/5 rounded-[20px] bg-surface ring-1 ring-black/5">
          {isLoading && <SkeletonRow />}
          {!isLoading && data?.recent.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No contracts yet.
            </div>
          )}
          {data?.recent.map((c) => (
            <Link
              key={c.id}
              to="/contracts/$id"
              params={{ id: String(c.id) }}
              className="flex items-center justify-between p-4 transition active:bg-black/[.02]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {c.dealer_name ??
                    c.dealer ??
                    c.contract_number ??
                    `Contract ${String(c.id).slice(0, 6)}`}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatCurrency(Number(c.amount) || 0)}
                  {c.created_at ? ` • ${formatShortDate(c.created_at)}` : ""}
                </p>
              </div>
              <StatusPill status={c.status ?? "pending"} />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 space-y-3">
        <h3 className="text-sm font-semibold">Recent Payments</h3>
        <div className="rounded-[20px] bg-surface p-6 text-center text-sm text-muted-foreground ring-1 ring-black/5">
          No payments yet
        </div>
      </section>
    </MobileShell>
  );
}

function KpiCard({
  label,
  value,
  loading,
  valueClassName,
}: {
  label: string;
  value: number | string;
  loading?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-[20px] bg-surface p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <h3 className={`mt-1 text-lg font-semibold ${valueClassName ?? ""}`}>
        {loading ? "—" : value}
      </h3>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      <div className="h-4 w-32 rounded bg-black/5" />
      <div className="h-3 w-20 rounded bg-black/5" />
    </div>
  );
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}
