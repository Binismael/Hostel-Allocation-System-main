import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BedDouble, Download, Eye, Search, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import StatusBadge from "@/components/StatusBadge";
import BunkAssignDialog, { type AssignTarget } from "@/components/admin/allocations/BunkAssignDialog";
import ReleaseAllocationDialog, { type ReleaseTarget } from "@/components/admin/allocations/ReleaseAllocationDialog";
import { getAllocations } from "@/lib/supabase-db";
import { hasVerifiedRoomPayment } from "@/lib/admin-workflow";

interface Row {
  dbId: string;
  id: string;
  studentName: string;
  studentId: string;
  location: string | null;
  bunk: string | null;
  requestDate: string;
  status: string;
  paymentStatus: string | null;
  awaitingBunk: boolean;
}

const toRow = (alloc: any): Row => {
  const paid = hasVerifiedRoomPayment(alloc);
  return {
    dbId: alloc.id,
    id: alloc.allocation_id,
    studentName: alloc.students?.name || "Unknown",
    studentId: alloc.students?.student_id || "N/A",
    location: alloc.rooms ? `${alloc.rooms.blocks?.name ?? ""} · Room ${alloc.rooms.room_number}` : null,
    bunk: alloc.bunks?.bunk_number ?? null,
    requestDate: alloc.request_date,
    status: alloc.status,
    paymentStatus: alloc.hostel_payments?.[0]?.status ?? null,
    awaitingBunk: paid && alloc.status === "pending",
  };
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "awaiting", label: "Paid, awaiting bunk" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

const exportCsv = (rows: Row[]) => {
  const header = ["Allocation ID", "Student", "Student ID", "Room", "Bunk", "Request date", "Status", "Payment"];
  const lines = rows.map((r) =>
    [r.id, r.studentName, r.studentId, r.location ?? "", r.bunk ?? "", r.requestDate, r.status, r.paymentStatus ?? ""]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "allocations.csv";
  a.click();
  URL.revokeObjectURL(url);
};

const Allocations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(params.get("filter") ?? "all");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<ReleaseTarget | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getAllocations();
    setLoading(false);
    if (error) {
      toast({ title: "Failed to load allocations", description: error.message, variant: "destructive" });
      return;
    }
    setRows((data || []).map(toRow));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = rows.filter((r) => {
    const term = search.toLowerCase();
    const matches =
      !term || [r.studentName, r.id, r.studentId].some((v) => v.toLowerCase().includes(term));
    const matchesFilter =
      filter === "all" || (filter === "awaiting" ? r.awaitingBunk : r.status === filter);
    return matches && matchesFilter;
  });

  const awaitingCount = rows.filter((r) => r.awaitingBunk).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Allocations</h2>
            <p className="mt-1 text-muted-foreground">
              Bunks are assigned once a student&apos;s room payment is verified.
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => exportCsv(visible)}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {awaitingCount > 0 && (
          <Card className="flex items-center justify-between gap-4 border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm text-amber-900">
              {awaitingCount} student{awaitingCount > 1 ? "s have" : " has"} a verified payment but no bunk yet.
            </p>
            <Button size="sm" variant="outline" onClick={() => setFilter("awaiting")}>
              Show them
            </Button>
          </Card>
        )}

        <Card className="flex flex-wrap items-center gap-3 border border-border p-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={filter === f.value ? "default" : "outline"}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <div className="relative ml-auto min-w-64 flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        <Card className="overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-left">
                  <th className="px-6 py-4 font-semibold">Allocation ID</th>
                  <th className="px-6 py-4 font-semibold">Student</th>
                  <th className="px-6 py-4 font-semibold">Room / bunk</th>
                  <th className="px-6 py-4 font-semibold">Payment</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Loading allocations…
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No allocations found
                    </td>
                  </tr>
                ) : (
                  visible.map((r) => (
                    <tr key={r.dbId} className="border-b border-border hover:bg-secondary/20">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{r.id}</p>
                        <p className="text-xs text-muted-foreground">{r.requestDate}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{r.studentName}</p>
                        <p className="text-xs text-muted-foreground">{r.studentId}</p>
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {r.location ? (
                          <>
                            <p className="font-medium">{r.location}</p>
                            {r.bunk && <p className="text-xs text-muted-foreground">Bunk {r.bunk}</p>}
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {r.paymentStatus ? (
                          <StatusBadge status={r.paymentStatus} />
                        ) : (
                          <span className="text-muted-foreground">Not paid</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={r.awaitingBunk ? "waitlisted" : r.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="View details"
                            onClick={() => navigate(`/admin/allocations/view/${r.dbId}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(r.awaitingBunk || r.status === "approved") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-green-700"
                              title={r.bunk ? "Move to another bunk" : "Assign bunk"}
                              onClick={() => setAssignTarget({ allocationId: r.dbId, studentName: r.studentName })}
                            >
                              <BedDouble className="h-4 w-4" />
                            </Button>
                          )}
                          {r.status !== "rejected" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600"
                              title={r.bunk ? "Release bunk" : "Reject"}
                              onClick={() =>
                                setReleaseTarget({ allocationId: r.dbId, studentName: r.studentName, hasBunk: !!r.bunk })
                              }
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <BunkAssignDialog
        target={assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssigned={() => {
          setAssignTarget(null);
          load();
        }}
      />
      <ReleaseAllocationDialog
        target={releaseTarget}
        onClose={() => setReleaseTarget(null)}
        onReleased={() => {
          setReleaseTarget(null);
          load();
        }}
      />
    </AdminLayout>
  );
};

export default Allocations;
