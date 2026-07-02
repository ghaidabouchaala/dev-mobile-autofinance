import { cn } from "@/lib/utils";

export type ContractStatus =
  | "pending"
  | "funded"
  | "sent_back"
  | "approved"
  | "rejected"
  | string;

const LABELS: Record<string, string> = {
  pending: "Pending",
  funded: "Funded",
  sent_back: "Sent Back",
  approved: "Approved",
  rejected: "Rejected",
};

export function StatusPill({ status, className }: { status: ContractStatus; className?: string }) {
  const key = String(status ?? "").toLowerCase();
  const label = LABELS[key] ?? String(status ?? "—");

  const tone =
    key === "funded" || key === "approved"
      ? "bg-status-funded-bg text-status-funded-fg"
      : key === "sent_back" || key === "rejected"
        ? "bg-status-sentback-bg text-status-sentback-fg"
        : "bg-status-pending-bg text-status-pending-fg";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider",
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}
