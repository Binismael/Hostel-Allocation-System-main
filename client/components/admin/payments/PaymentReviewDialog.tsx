import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import StatusBadge from "@/components/StatusBadge";
import {
  getReceiptUrl,
  listPaymentEvents,
  reviewPayment,
  type AdminPayment,
  type PaymentEvent,
} from "@/lib/admin-workflow";
import PaymentDetailsList from "./PaymentDetailsList";
import PaymentTimeline from "./PaymentTimeline";

interface Props {
  payment: AdminPayment | null;
  onClose: () => void;
  onReviewed: () => void;
}

const outcomeMessage = (outcome?: {
  outcome: string;
  block_name: string | null;
  room_number: string | null;
  bunk_number: string | null;
}) => {
  switch (outcome?.outcome) {
    case "allocated":
      return `Verified and allocated to ${outcome.block_name}, room ${outcome.room_number}, bunk ${outcome.bunk_number}.`;
    case "waitlisted":
      return "Verified. No matching bunk is free, so the student is waitlisted — assign one from Allocations.";
    case "rejected":
      return "Payment rejected. The student has been notified.";
    default:
      return "Payment verified.";
  }
};

const PaymentReviewDialog = ({ payment, onClose, onReviewed }: Props) => {
  const { toast } = useToast();
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [working, setWorking] = useState<"verified" | "rejected" | null>(null);

  useEffect(() => {
    if (!payment) return;
    setNotes("");
    setReceiptUrl(null);
    listPaymentEvents(payment.id).then(({ data }) => setEvents(data));
    getReceiptUrl(payment.receipt_path).then(({ url }) => setReceiptUrl(url));
  }, [payment]);

  const decide = async (decision: "verified" | "rejected") => {
    if (!payment) return;
    if (decision === "rejected" && !notes.trim()) {
      toast({
        title: "Reason required",
        description: "Tell the student why the payment was rejected.",
        variant: "destructive",
      });
      return;
    }
    setWorking(decision);
    const { data, error } = await reviewPayment(payment.id, decision, notes);
    setWorking(null);
    if (error) {
      toast({ title: "Could not save decision", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: decision === "verified" ? "Payment verified" : "Payment rejected", description: outcomeMessage(data) });
    onReviewed();
  };

  const canReview = payment?.status === "submitted";
  const isImage = payment && /\.(jpe?g|png)$/i.test(payment.receipt_path);

  return (
    <Dialog open={!!payment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        {payment && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {payment.payment_reference}
                <StatusBadge status={payment.status} />
              </DialogTitle>
              <DialogDescription>
                Submitted {new Date(payment.submitted_at).toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 md:grid-cols-2">
              <PaymentDetailsList payment={payment} />
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-foreground">Receipt</h4>
                  {receiptUrl ? (
                    <a href={receiptUrl} target="_blank" rel="noreferrer" className="block">
                      {isImage ? (
                        <img
                          src={receiptUrl}
                          alt="Transfer receipt"
                          className="max-h-64 w-full rounded-md border border-border object-contain"
                        />
                      ) : null}
                      <span className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                        Open receipt <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">Loading receipt…</p>
                  )}
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-foreground">History</h4>
                  <PaymentTimeline events={events} />
                </div>
              </div>
            </div>

            {canReview && (
              <div className="space-y-3 border-t border-border pt-4">
                <label htmlFor="review-notes" className="text-sm font-medium text-foreground">
                  Notes (required when rejecting)
                </label>
                <Textarea
                  id="review-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Amount confirmed on bank statement, or reason for rejection"
                  rows={3}
                />
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="outline"
                    className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                    disabled={!!working}
                    onClick={() => decide("rejected")}
                  >
                    <XCircle className="h-4 w-4" />
                    {working === "rejected" ? "Rejecting…" : "Reject"}
                  </Button>
                  <Button className="gap-2" disabled={!!working} onClick={() => decide("verified")}>
                    <CheckCircle2 className="h-4 w-4" />
                    {working === "verified" ? "Verifying…" : "Verify & allocate"}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentReviewDialog;
