import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { setRoomRequestStatus, type RoomRequestRow } from "@/lib/room-requests";

interface Props {
  request: RoomRequestRow | null;
  paymentStatus?: string;
  onClose: () => void;
  onSaved: () => void;
}

const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="text-right font-medium text-foreground">{value || "—"}</dd>
  </div>
);

const RoomRequestDialog = ({ request, paymentStatus, onClose, onSaved }: Props) => {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => setMessage(""), [request]);

  const save = async (status: "reviewed" | "rejected") => {
    if (!request) return;
    if (status === "rejected" && !message.trim()) {
      toast({ title: "Reason required", description: "Tell the student why.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await setRoomRequestStatus(request, status, message);
    setSaving(false);
    if (error) {
      toast({ title: "Could not update request", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: status === "rejected" ? "Request rejected" : "Request marked as reviewed" });
    onSaved();
  };

  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        {request && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {request.students?.name ?? "Student"}
                <StatusBadge status={request.status} />
              </DialogTitle>
              <DialogDescription>
                {request.students?.student_id} · submitted{" "}
                {new Date(request.submitted_at).toLocaleDateString()}
              </DialogDescription>
            </DialogHeader>

            <dl>
              <Row label="Email" value={request.students?.email} />
              <Row label="Phone" value={request.phone} />
              <Row label="Semester" value={request.semester} />
              <Row label="Reason" value={request.allocation_reason} />
              <Row label="1st choice" value={request.p1?.name} />
              <Row label="2nd choice" value={request.p2?.name} />
              <Row label="3rd choice" value={request.p3?.name} />
              <Row
                label="Room preference"
                value={[request.room_category_preference, request.room_type_preference, request.room_capacity_preference && `${request.room_capacity_preference} people`]
                  .filter(Boolean)
                  .join(" · ")}
              />
              <Row label="Comments" value={request.comments} />
              <Row label="Latest payment" value={paymentStatus ?? "No payment yet"} />
            </dl>

            <p className="text-xs text-muted-foreground">
              Bunks are assigned when the student&apos;s payment is verified on the{" "}
              <Link to="/admin/payments" className="text-primary underline">
                Payments
              </Link>{" "}
              page.
            </p>

            {request.status === "pending" && (
              <div className="space-y-3 border-t border-border pt-4">
                <label htmlFor="request-message" className="text-sm font-medium">
                  Message to student (required when rejecting)
                </label>
                <Textarea
                  id="request-message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    disabled={saving}
                    onClick={() => save("rejected")}
                  >
                    Reject
                  </Button>
                  <Button disabled={saving} onClick={() => save("reviewed")}>
                    Mark reviewed
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

export default RoomRequestDialog;
