import { createFileRoute, redirect } from "@tanstack/react-router";

// Landing → send to dashboard. The _authenticated gate will bounce
// unauthenticated users to /auth.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
