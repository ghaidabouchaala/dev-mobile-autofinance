import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";

export const Route = createFileRoute("/_authenticated/dealers")({
  component: () => (
    <MobileShell title="Dealers">
      <ComingSoon label="Dealers" />
    </MobileShell>
  ),
});

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="rounded-[20px] bg-surface p-8 text-center ring-1 ring-black/5">
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        This section will ship in the next milestone.
      </p>
    </div>
  );
}
