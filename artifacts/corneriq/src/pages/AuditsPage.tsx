import { useState } from "react";
import { Plus, CheckCircle, Clock, AlertCircle } from "lucide-react";
import {
  useGetAudits,
  useGetAudit,
  useCreateAudit,
  useSubmitAuditCount,
  useCompleteAudit,
  type Audit,
  type AuditType,
} from "@workspace/api-client-react";
import { cn, formatGBP, formatDate } from "../lib/utils";

const STATUS_CLASSES: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  scheduled: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle,
  cancelled: Clock,
};

const VARIANCE_CLASSES: Record<string, string> = {
  match: "bg-green-100 text-green-700",
  minor_variance: "bg-amber-100 text-amber-700",
  significant_variance: "bg-red-100 text-red-700",
  pending: "bg-gray-100 text-gray-500",
};

function RunAuditView({ auditId, onBack }: { auditId: number; onBack: () => void }) {
  const { data: audit, isPending } = useGetAudit(auditId);
  const submitCount = useSubmitAuditCount();
  const completeAudit = useCompleteAudit();
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [discrepancies, setDiscrepancies] = useState<Record<number, string>>({});

  if (isPending) {
    return <p className="text-center text-gray-400">Loading audit…</p>;
  }
  if (!audit) return null;

  const pendingCount = audit.items.filter((i) => i.status === "pending").length;
  const allCounted = pendingCount === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Audits
        </button>
        <span className="text-gray-300">|</span>
        <h2 className="text-base font-semibold text-gray-900">
          {audit.auditType.replace("_", " ")} Audit
        </h2>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
            STATUS_CLASSES[audit.status],
          )}
        >
          {audit.status.replace("_", " ")}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3 text-right">Expected</th>
              <th className="px-4 py-3 text-right">Actual</th>
              <th className="px-4 py-3 text-right">Variance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 w-40">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {audit.items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {item.productName}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {item.sku}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {item.expectedQuantity}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {item.actualQuantity ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  {item.variance !== null && item.variance !== undefined ? (
                    <span
                      className={cn(
                        "font-medium",
                        item.variance < 0
                          ? "text-red-600"
                          : item.variance > 0
                            ? "text-green-600"
                            : "text-gray-500",
                      )}
                    >
                      {item.variance > 0 ? "+" : ""}
                      {item.variance}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      VARIANCE_CLASSES[item.status] ?? "bg-gray-100 text-gray-500",
                    )}
                  >
                    {item.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {audit.status === "in_progress" && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={counts[item.id] ?? ""}
                        onChange={(e) =>
                          setCounts((p) => ({
                            ...p,
                            [item.id]: e.target.value,
                          }))
                        }
                        placeholder="Count"
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:border-blue-400"
                      />
                      <button
                        onClick={() => {
                          const val = counts[item.id];
                          if (val !== undefined) {
                            submitCount.mutate({
                              auditId,
                              itemId: item.id,
                              actualQuantity: parseInt(val),
                              discrepancyCategory: discrepancies[item.id],
                            });
                          }
                        }}
                        disabled={!counts[item.id]}
                        className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {audit.status === "in_progress" && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">
            {pendingCount > 0
              ? `${pendingCount} items still pending`
              : "All items counted — ready to complete"}
          </p>
          <button
            onClick={() => completeAudit.mutate(auditId, { onSuccess: onBack })}
            disabled={!allCounted || completeAudit.isPending}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {completeAudit.isPending ? "Completing…" : "Complete Audit"}
          </button>
        </div>
      )}

      {audit.status === "completed" && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-sm font-medium text-green-800">Audit completed</p>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-green-600">Products Audited</p>
              <p className="font-semibold text-green-900">
                {audit.totalProductsAudited}
              </p>
            </div>
            <div>
              <p className="text-xs text-green-600">Total Variance Value</p>
              <p className="font-semibold text-green-900">
                {formatGBP(audit.totalVarianceValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-green-600">Shrinkage Rate</p>
              <p className="font-semibold text-green-900">
                {parseFloat(audit.shrinkageRate ?? "0").toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditsPage() {
  const { data: audits, isPending } = useGetAudits();
  const createAudit = useCreateAudit();
  const [runningAuditId, setRunningAuditId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newType, setNewType] = useState<AuditType>("spot_check");

  if (runningAuditId) {
    return (
      <RunAuditView
        auditId={runningAuditId}
        onBack={() => setRunningAuditId(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-500">
          {audits?.length ?? 0} audits
        </h2>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Audit
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="mb-3 text-sm font-medium text-blue-900">Start New Audit</p>
          <div className="flex items-center gap-3">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as AuditType)}
              className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm focus:outline-none"
            >
              {(["spot_check", "weekly", "monthly", "full"] as AuditType[]).map(
                (t) => (
                  <option key={t} value={t}>
                    {t.replace("_", " ")}
                  </option>
                ),
              )}
            </select>
            <button
              onClick={() =>
                createAudit.mutate(
                  { auditType: newType },
                  {
                    onSuccess: (audit) => {
                      setShowCreate(false);
                      setRunningAuditId(audit.id);
                    },
                  },
                )
              }
              disabled={createAudit.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {createAudit.isPending ? "Creating…" : "Start"}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isPending ? (
          <p className="col-span-full text-center text-gray-400">Loading…</p>
        ) : !audits?.length ? (
          <p className="col-span-full text-center text-gray-400">
            No audits yet. Start your first audit above.
          </p>
        ) : (
          audits.map((audit) => {
            const StatusIcon = STATUS_ICONS[audit.status] ?? Clock;
            return (
              <div
                key={audit.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold capitalize text-gray-900">
                      {audit.auditType.replace("_", " ")} Audit
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(audit.scheduledFor)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_CLASSES[audit.status],
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {audit.status.replace("_", " ")}
                  </span>
                </div>

                {audit.status === "completed" && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded bg-gray-50 p-2">
                      <p className="text-gray-500">Variance Value</p>
                      <p className="font-semibold text-gray-900">
                        {formatGBP(audit.totalVarianceValue)}
                      </p>
                    </div>
                    <div className="rounded bg-gray-50 p-2">
                      <p className="text-gray-500">Shrinkage</p>
                      <p className="font-semibold text-gray-900">
                        {parseFloat(audit.shrinkageRate ?? "0").toFixed(2)}%
                      </p>
                    </div>
                  </div>
                )}

                {audit.notes && (
                  <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                    {audit.notes}
                  </p>
                )}

                {audit.status !== "cancelled" && (
                  <button
                    onClick={() => setRunningAuditId(audit.id)}
                    className="mt-3 w-full rounded-lg border border-gray-300 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {audit.status === "completed" ? "View Results" : "Continue Audit"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
