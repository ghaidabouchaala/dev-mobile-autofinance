import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, FileText, Users, CreditCard, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const TABS = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/contracts", label: "Contracts", icon: FileText },
  { to: "/dealers", label: "Dealers", icon: Users },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/documents", label: "Docs", icon: FolderOpen },
] as const;

export function MobileShell({
  children,
  title,
  back,
  right,
}: {
  children: ReactNode;
  title?: string;
  back?: { to: string; label?: string };
  right?: ReactNode;
}) {
  const { pathname } = useLocation();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background text-foreground">
      {(title || back || right) && (
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-background/85 px-5 pb-3 pt-6 backdrop-blur-md">
          {back ? (
            <Link
              to={back.to}
              className="grid size-9 place-items-center rounded-full bg-surface ring-1 ring-black/5 text-muted-foreground transition active:scale-95"
              aria-label={back.label ?? "Back"}
            >
              <span aria-hidden>←</span>
            </Link>
          ) : null}
          {title ? (
            <h1 className="flex-1 text-lg font-semibold tracking-tight">{title}</h1>
          ) : (
            <div className="flex-1" />
          )}
          {right}
        </header>
      )}

      <main className="flex-1 overflow-y-auto px-5 pb-28 pt-4">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border/60 bg-background/85 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="flex items-center justify-between px-3 pt-2 pb-3">
          {TABS.map((tab) => {
            const active =
              pathname === tab.to ||
              (tab.to !== "/dashboard" && pathname.startsWith(tab.to));
            const Icon = tab.icon;
            return (
              <li key={tab.to} className="flex-1">
                <Link
                  to={tab.to}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg py-1.5 transition",
                    active ? "text-primary" : "text-muted-foreground/70",
                  )}
                >
                  <Icon className={cn("size-5", active && "stroke-[2.4]")} />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
