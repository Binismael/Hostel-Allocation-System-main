import { useEffect, useState } from "react";
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
import { releaseAllocation } from "@/lib/admin-workflow";

export interface ReleaseTarget {
  allocationId: string;
  studentName: string;
  hasBunk: boolean;
}

interface Props {
  target: ReleaseTarget | null;
  onClose: () => void;
  onReleased: () => void;
}

const ReleaseAllocationDialog = ({ target, onClose, onReleased }: Props) => {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => setReason(""), [target]);

  const submit = async () => {
    if (!target || !reason.trim()) return;
    setSaving(true);
    const { error } = await releaseAllocation(target.allocationId, reason);
    setSaving(false);
    if (error) {
      toast({ title: "Could not update allocation", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: target.hasBunk ? "Allocation released" : "Allocation rejected" });
    onReleased();
  };

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{target?.hasBunk ? "Release allocation" : "Reject allocation"}</DialogTitle>
          <DialogDescription>
            {target?.hasBunk
              ? `${target.studentName}'s bunk will be freed for another student.`
              : `${target?.studentName}'s request will be marked as rejected.`}{" "}
            The student is notified with your reason.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={3}
          placeholder="Reason (required)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} disabled={!reason.trim() || saving}>
            {saving ? "Saving…" : target?.hasBunk ? "Release" : "Reject"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReleaseAllocationDialog;
