import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { MobileShell } from "@/components/mobile-shell";
import { StatusPill } from "@/components/status-pill";
import {
  FileText,
  Upload,
  Check,
  X,
  RotateCcw,
  Clock,
  Eye,
  Loader2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/documents")({
  component: DocumentsPage,
});

type Doc = Record<string, any>;

const FILTERS = ["all", "pending", "approved", "sent_back", "rejected"] as const;
type Filter = (typeof FILTERS)[number];

const BUCKET = "contract-documents";

function DocumentsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [reviewDoc, setReviewDoc] = useState<Doc | null>(null);
  const [historyDoc, setHistoryDoc] = useState<Doc | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["documents", filter],
    queryFn: async () => {
      let q = supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Doc[];
    },
  });

  return (
    <MobileShell
      title="Documents"
      right={
        <button
          onClick={() => setUploadOpen(true)}
          className="grid size-9 place-items-center rounded-full bg-foreground text-background transition active:scale-95"
          aria-label="Upload document"
        >
          <Plus className="size-4" />
        </button>
      }
    >
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition",
              filter === f
                ? "bg-foreground text-background"
                : "bg-surface text-muted-foreground ring-1 ring-black/5",
            )}
          >
            {labelFor(f)}
          </button>
        ))}
      </div>

      <div className="divide-y divide-black/5 rounded-[20px] bg-surface ring-1 ring-black/5">
        {isLoading && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading documents…
          </div>
        )}
        {!isLoading && (data ?? []).length === 0 && (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-black/[.04] text-muted-foreground">
              <FileText className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">No documents yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Upload a contract document to get started.
              </p>
            </div>
            <button
              onClick={() => setUploadOpen(true)}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background"
            >
              <Upload className="size-3.5" /> Upload document
            </button>
          </div>
        )}
        {(data ?? []).map((d) => (
          <button
            key={d.id}
            onClick={() => setReviewDoc(d)}
            className="flex w-full items-center gap-3 p-4 text-left transition active:bg-black/[.02]"
          >
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-black/[.04] text-muted-foreground">
              <FileText className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {d.name ?? d.file_name ?? d.filename ?? fileFromPath(d.storage_path ?? d.file_path) ?? "Untitled document"}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {d.document_type ?? d.type ?? "Document"}
                {d.created_at ? ` • ${formatDate(d.created_at)}` : ""}
              </p>
            </div>
            <StatusPill status={d.status ?? "pending"} />
          </button>
        ))}
      </div>

      {uploadOpen && (
        <UploadSheet
          onClose={() => setUploadOpen(false)}
        />
      )}
      {reviewDoc && (
        <ReviewSheet
          doc={reviewDoc}
          onClose={() => setReviewDoc(null)}
          onHistory={() => {
            setHistoryDoc(reviewDoc);
            setReviewDoc(null);
          }}
        />
      )}
      {historyDoc && (
        <HistorySheet doc={historyDoc} onClose={() => setHistoryDoc(null)} />
      )}
    </MobileShell>
  );
}

/* ---------------- Upload ---------------- */

function UploadSheet({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [contractId, setContractId] = useState<string>("");
  const [docType, setDocType] = useState<string>("contract");

  const { data: contracts } = useQuery({
    queryKey: ["contracts", "picker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, contract_number, customer_name")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Pick a file first");
      if (!contractId) throw new Error("Pick a contract");
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${contractId}/${Date.now()}-${safe}`;
      const up = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
      });
      if (up.error) throw up.error;
      const insert = await supabase.from("documents").insert({
        contract_id: contractId,
        name: file.name,
        file_name: file.name,
        storage_path: path,
        file_path: path,
        document_type: docType,
        status: "pending",
        uploaded_by: userId,
        created_by: userId,
        mime_type: file.type || null,
        size_bytes: file.size,
      } as any);
      if (insert.error) {
        // roll back the upload if the insert fails
        await supabase.storage.from(BUCKET).remove([path]);
        throw insert.error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      onClose();
    },
  });

  return (
    <Sheet title="Upload document" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Contract">
          <select
            value={contractId}
            onChange={(e) => setContractId(e.target.value)}
            className="h-11 w-full rounded-xl bg-white px-3 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Select a contract…</option>
            {(contracts ?? []).map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.contract_number ?? String(c.id).slice(0, 8)}
                {c.customer_name ? ` — ${c.customer_name}` : ""}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Document type">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="h-11 w-full rounded-xl bg-white px-3 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-primary/30"
          >
            <option value="contract">Contract</option>
            <option value="id">ID / License</option>
            <option value="proof_of_income">Proof of income</option>
            <option value="insurance">Insurance</option>
            <option value="title">Title</option>
            <option value="other">Other</option>
          </select>
        </Field>

        <Field label="File">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-11 w-full items-center justify-between rounded-xl bg-white px-3 text-sm ring-1 ring-black/10 active:bg-black/[.02]"
          >
            <span className="truncate text-muted-foreground">
              {file ? file.name : "Choose file…"}
            </span>
            <Upload className="size-4 text-muted-foreground" />
          </button>
        </Field>

        {upload.error && (
          <p className="text-xs text-red-600">
            {(upload.error as Error).message}
          </p>
        )}

        <button
          onClick={() => upload.mutate()}
          disabled={upload.isPending || !file || !contractId}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-semibold text-background disabled:opacity-50"
        >
          {upload.isPending && <Loader2 className="size-4 animate-spin" />}
          Upload
        </button>
      </div>
    </Sheet>
  );
}

/* ---------------- Review ---------------- */

function ReviewSheet({
  doc,
  onClose,
  onHistory,
}: {
  doc: Doc;
  onClose: () => void;
  onHistory: () => void;
}) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const act = useMutation({
    mutationFn: async (status: "approved" | "rejected" | "sent_back") => {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      const upd = await supabase
        .from("documents")
        .update({
          status,
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          review_note: note || null,
        } as any)
        .eq("id", doc.id);
      if (upd.error) throw upd.error;
      // Best-effort event log; ignore if table shape differs.
      await supabase
        .from("document_events")
        .insert({
          document_id: doc.id,
          event_type: status,
          note: note || null,
          created_by: userId,
        } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      onClose();
    },
  });

  async function openPreview() {
    const path = doc.storage_path ?? doc.file_path;
    if (!path) return;
    setPreviewLoading(true);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 300);
    setPreviewLoading(false);
    if (!error && data?.signedUrl) {
      setPreviewUrl(data.signedUrl);
      window.open(data.signedUrl, "_blank", "noopener");
    }
  }

  return (
    <Sheet title="Review document" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/10">
          <p className="truncate text-sm font-semibold">
            {doc.name ?? doc.file_name ?? "Document"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {doc.document_type ?? doc.type ?? "Document"}
            {doc.created_at ? ` • ${formatDate(doc.created_at)}` : ""}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <StatusPill status={doc.status ?? "pending"} />
            <button
              onClick={openPreview}
              disabled={previewLoading}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-black/[.04] px-3 py-1.5 text-xs font-semibold text-foreground active:scale-95"
            >
              {previewLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Eye className="size-3.5" />
              )}
              Preview
            </button>
            <button
              onClick={onHistory}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/[.04] px-3 py-1.5 text-xs font-semibold text-foreground active:scale-95"
            >
              <Clock className="size-3.5" /> History
            </button>
          </div>
        </div>

        <Field label="Note (optional)">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="Reason or instructions for the dealer…"
            className="w-full rounded-xl bg-white p-3 text-sm outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-primary/30"
          />
        </Field>

        {act.error && (
          <p className="text-xs text-red-600">{(act.error as Error).message}</p>
        )}

        <div className="grid grid-cols-3 gap-2">
          <ActionButton
            tone="approve"
            onClick={() => act.mutate("approved")}
            disabled={act.isPending}
            icon={<Check className="size-4" />}
            label="Approve"
          />
          <ActionButton
            tone="sendback"
            onClick={() => act.mutate("sent_back")}
            disabled={act.isPending}
            icon={<RotateCcw className="size-4" />}
            label="Send back"
          />
          <ActionButton
            tone="reject"
            onClick={() => act.mutate("rejected")}
            disabled={act.isPending}
            icon={<X className="size-4" />}
            label="Reject"
          />
        </div>
        {previewUrl && (
          <p className="text-center text-[11px] text-muted-foreground">
            Opened preview in a new tab.
          </p>
        )}
      </div>
    </Sheet>
  );
}

function ActionButton({
  tone,
  onClick,
  disabled,
  icon,
  label,
}: {
  tone: "approve" | "reject" | "sendback";
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  const cls =
    tone === "approve"
      ? "bg-status-funded-bg text-status-funded-fg"
      : tone === "sendback"
        ? "bg-status-pending-bg text-status-pending-fg"
        : "bg-status-sentback-bg text-status-sentback-fg";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold disabled:opacity-50",
        cls,
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/* ---------------- History ---------------- */

function HistorySheet({ doc, onClose }: { doc: Doc; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["document_events", doc.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_events")
        .select("*")
        .eq("document_id", doc.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Doc[];
    },
  });

  return (
    <Sheet title="Document history" onClose={onClose}>
      {isLoading && (
        <div className="p-6 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      )}
      {!isLoading && (data ?? []).length === 0 && (
        <div className="rounded-xl bg-white p-6 text-center text-sm text-muted-foreground ring-1 ring-black/10">
          No events yet for this document.
        </div>
      )}
      <ul className="space-y-2">
        {(data ?? []).map((e) => (
          <li
            key={e.id}
            className="rounded-xl bg-white p-3 text-sm ring-1 ring-black/10"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold capitalize">
                {String(e.event_type ?? "event").replace(/_/g, " ")}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {e.created_at ? formatDate(e.created_at) : ""}
              </span>
            </div>
            {e.note && (
              <p className="mt-1 text-xs text-muted-foreground">{e.note}</p>
            )}
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

/* ---------------- Building blocks ---------------- */

function Sheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative mx-auto max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-5 ring-1 ring-black/5"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/10" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full bg-black/[.05] text-muted-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

/* ---------------- Utils ---------------- */

function labelFor(f: Filter) {
  if (f === "all") return "All";
  if (f === "sent_back") return "Sent Back";
  return f[0].toUpperCase() + f.slice(1);
}

function fileFromPath(p?: string | null) {
  if (!p) return null;
  const parts = p.split("/");
  return parts[parts.length - 1] || null;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
