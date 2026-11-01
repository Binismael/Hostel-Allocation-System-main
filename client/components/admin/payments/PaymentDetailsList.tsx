import { formatNaira } from "@/lib/payments";
import type { AdminPayment } from "@/lib/admin-workflow";

const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="text-right font-medium text-foreground break-all">{value || "—"}</dd>
  </div>
);

const PaymentDetailsList = ({ payment }: { payment: AdminPayment }) => {
  const room = payment.rooms
    ? `${payment.rooms.blocks?.name ?? ""} · Room ${payment.rooms.room_number} (${payment.rooms.room_category ?? "standard"})`
    : null;

  return (
    <dl>
      <Row label="Student" value={`${payment.students?.name ?? "Unknown"} (${payment.students?.student_id ?? "—"})`} />
      <Row label="Fee" value={`${payment.hostel_fee_tiers?.name ?? "—"} · ${formatNaira(payment.amount)}`} />
      <Row label="Selected room" value={room} />
      <Row label="Transfer date" value={payment.paid_at} />
      <Row label="Sender" value={[payment.payer_name, payment.payer_bank].filter(Boolean).join(" · ")} />
      <Row
        label="Recipient"
        value={[payment.recipient_account_name, payment.recipient_account_number].filter(Boolean).join(" · ")}
      />
      <Row label="Session ID" value={payment.session_id} />
      <Row label="Reference ID" value={payment.bank_reference} />
      <Row label="Authorized by" value={payment.authorized_email} />
      <Row label="Remarks" value={payment.remarks} />
      {payment.rejection_reason && <Row label="Rejection reason" value={payment.rejection_reason} />}
    </dl>
  );
};

export default PaymentDetailsList;
