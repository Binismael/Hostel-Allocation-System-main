import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Plus } from "lucide-react";
import StudentLayout from "@/components/layouts/StudentLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import PaymentTimeline from "@/components/admin/payments/PaymentTimeline";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatNaira } from "@/lib/payments";
import { getReceiptUrl, listPaymentEvents, type PaymentEvent } from "@/lib/admin-workflow";

interface MyPayment {
  id: string;
  payment_reference: string;
  amount: number;
  status: string;
  paid_at: string;
  submitted_at: string;
  bank_reference: string | null;
  receipt_path: string;
  rejection_reason: string | null;
  hostel_fee_tiers: { name: string } | null;
  rooms: { room_number: string; blocks: { name: string } | null } | null;
}

const PaymentCard = ({ payment }: { payment: MyPayment }) => {
  const [events, setEvents] = useState<PaymentEvent[] | null>(null);

  const showHistory = async () => {
    const { data } = await listPaymentEvents(payment.id);
    setEvents(data);
  };

  const openReceipt = async () => {
    const { url } = await getReceiptUrl(payment.receipt_path);
    if (url) window.open(url, "_blank", "noopener");
  };

  return (
    <Card className="space-y-3 border border-border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{payment.hostel_fee_tiers?.name ?? "Hostel fee"}</p>
          <p className="text-sm text-muted-foreground">
            {payment.payment_reference} · {formatNaira(payment.amount)}
          </p>
        </div>
        <StatusBadge status={payment.status} />
      </div>
      <div className="grid gap-2 text-sm sm:grid-cols-3">
        <p>
          <span className="text-muted-foreground">Transfer date: </span>
          {payment.paid_at}
        </p>
        <p>
          <span className="text-muted-foreground">Reference ID: </span>
          {payment.bank_reference ?? "—"}
        </p>
        <p>
          <span className="text-muted-foreground">Room: </span>
          {payment.rooms ? `${payment.rooms.blocks?.name ?? ""} · ${payment.rooms.room_number}` : "—"}
        </p>
      </div>
      {payment.rejection_reason && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Rejected: {payment.rejection_reason}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="gap-1" onClick={openReceipt}>
          Receipt <ExternalLink className="h-3.5 w-3.5" />
        </Button>
        {events === null && (
          <Button size="sm" variant="ghost" onClick={showHistory}>
            Show history
          </Button>
        )}
      </div>
      {events && <PaymentTimeline events={events} />}
    </Card>
  );
};

const MyPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<MyPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("hostel_payments")
      .select("id, payment_reference, amount, status, paid_at, submitted_at, bank_reference, receipt_path, rejection_reason, hostel_fee_tiers(name), rooms(room_number, blocks(name))")
      .eq("student_id", user.id)
      .order("submitted_at", { ascending: false })
      .then(({ data }) => {
        setPayments((data ?? []) as unknown as MyPayment[]);
        setLoading(false);
      });
  }, [user?.id]);

  const canPayAgain = !payments.some((p) => p.status === "submitted" || p.status === "verified");

  return (
    <StudentLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground">My Payments</h2>
            <p className="mt-1 text-muted-foreground">Payments you have submitted and their review status.</p>
          </div>
          {canPayAgain && (
            <Button asChild className="gap-2">
              <Link to="/student/hostel-directory">
                <Plus className="h-4 w-4" /> New payment
              </Link>
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading payments…</p>
        ) : payments.length === 0 ? (
          <Card className="border border-border p-8 text-center text-muted-foreground">
            You haven&apos;t submitted any payments yet.
          </Card>
        ) : (
          payments.map((p) => <PaymentCard key={p.id} payment={p} />)
        )}
      </div>
    </StudentLayout>
  );
};

export default MyPayments;
