import { useCallback, useEffect, useState } from "react";
import { Eye, Search } from "lucide-react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import StatusBadge from "@/components/StatusBadge";
import RoomRequestDialog from "@/components/admin/RoomRequestDialog";
import { listRoomRequests, type RoomRequestRow } from "@/lib/room-requests";

const FILTERS = ["pending", "reviewed", "rejected", "all"];

const RoomRequests = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<RoomRequestRow[]>([]);
  const [payments, setPayments] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RoomRequestRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, paymentStatus, error } = await listRoomRequests();
    setLoading(false);
    if (error) {
      toast({ title: "Could not load requests", description: error.message, variant: "destructive" });
      return;
    }
    setRequests(data);
    setPayments(paymentStatus);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = requests.filter((r) => {
    const term = search.toLowerCase();
    const matches =
      !term ||
      [r.students?.name, r.students?.student_id, r.students?.email]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(term));
    return matches && (filter === "all" || r.status === filter);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Room Requests</h2>
          <p className="mt-1 text-muted-foreground">
            Students&apos; hostel preferences and their payment progress.
          </p>
        </div>

        <Card className="flex flex-wrap items-center gap-3 border border-border p-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f} {f !== "all" && `(${requests.filter((r) => r.status === f).length})`}
              </Button>
            ))}
          </div>
          <div className="relative ml-auto min-w-64 flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search student…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Card>

        <Card className="overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-left">
                  <th className="px-6 py-4 font-semibold">Student</th>
                  <th className="px-6 py-4 font-semibold">1st choice</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Payment</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Loading requests…
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No room requests in this view.
                    </td>
                  </tr>
                ) : (
                  visible.map((r) => (
                    <tr key={r.id} className="border-b border-border hover:bg-secondary/20">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{r.students?.name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{r.students?.student_id}</p>
                      </td>
                      <td className="px-6 py-4 text-foreground">{r.p1?.name ?? "—"}</td>
                      <td className="px-6 py-4 capitalize text-foreground">
                        {r.room_category_preference ?? "—"}
                      </td>
                      <td className="px-6 py-4">
                        {payments.get(r.student_id) ? (
                          <StatusBadge status={payments.get(r.student_id)!} />
                        ) : (
                          <span className="text-muted-foreground">Not paid</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-6 py-4">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => setSelected(r)}>
                          <Eye className="h-4 w-4" /> View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <RoomRequestDialog
        request={selected}
        paymentStatus={selected ? payments.get(selected.student_id) : undefined}
        onClose={() => setSelected(null)}
        onSaved={() => {
          setSelected(null);
          load();
        }}
      />
    </AdminLayout>
  );
};

export default RoomRequests;
