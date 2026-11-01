import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import StatusBadge from "@/components/StatusBadge";
import PaymentReviewDialog from "@/components/admin/payments/PaymentReviewDialog";
import { listPayments, type AdminPayment } from "@/lib/admin-workflow";
import { formatNaira } from "@/lib/payments";

const FILTERS = [
  { value: "submitted", label: "Awaiting review" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const Payments = () => {
  const { toast } = useToast();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("submitted");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminPayment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await listPayments();
    setLoading(false);
    if (error) {
      toast({ title: "Could not load payments", description: error.message, variant: "destructive" });
      return;
    }
    setPayments(data);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () =>
      payments.reduce<Record<string, number>>((acc, p) => {
        acc[p.status] = (acc[p.status] ?? 0) + 1;
        return acc;
      }, {}),
    [payments],
  );

  const visible = payments.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      [p.payment_reference, p.bank_reference, p.session_id, p.students?.name, p.students?.student_id]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(term));
    return matchesSearch && (filter === "all" || p.status === filter);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Payments</h2>
          <p className="mt-1 text-muted-foreground">
            Check bank-transfer evidence. Verifying a room payment assigns a bunk automatically.
          </p>
        </div>

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
                {f.value !== "all" && ` (${counts[f.value] ?? 0})`}
              </Button>
            ))}
          </div>
          <div className="relative ml-auto min-w-64 flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search reference, session ID, student…"
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
                  <th className="px-6 py-4 font-semibold">Reference</th>
                  <th className="px-6 py-4 font-semibold">Student</th>
                  <th className="px-6 py-4 font-semibold">Fee</th>
                  <th className="px-6 py-4 font-semibold">Submitted</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Loading payments…
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No payments in this view.
                    </td>
                  </tr>
                ) : (
                  visible.map((p) => (
                    <tr key={p.id} className="border-b border-border hover:bg-secondary/20">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{p.payment_reference}</p>
                        <p className="text-xs text-muted-foreground">{p.bank_reference ?? "—"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{p.students?.name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{p.students?.student_id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-foreground">{p.hostel_fee_tiers?.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{formatNaira(p.amount)}</p>
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {new Date(p.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-6 py-4">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => setSelected(p)}>
                          <Eye className="h-4 w-4" />
                          {p.status === "submitted" ? "Review" : "View"}
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

      <PaymentReviewDialog
        payment={selected}
        onClose={() => setSelected(null)}
        onReviewed={() => {
          setSelected(null);
          load();
        }}
      />
    </AdminLayout>
  );
};

export default Payments;
