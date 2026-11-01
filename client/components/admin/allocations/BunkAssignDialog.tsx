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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  assignBunk,
  bunkLabel,
  getVerifiedRoomPayment,
  listAvailableBunks,
  type AvailableBunk,
} from "@/lib/admin-workflow";

export interface AssignTarget {
  allocationId: string;
  studentName: string;
}

interface Props {
  target: AssignTarget | null;
  onClose: () => void;
  onAssigned: () => void;
}

const BunkAssignDialog = ({ target, onClose, onAssigned }: Props) => {
  const { toast } = useToast();
  const [bunks, setBunks] = useState<AvailableBunk[]>([]);
  const [tierName, setTierName] = useState("");
  const [bunkId, setBunkId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) return;
    setBunkId("");
    setNotes("");
    setProblem("");
    setLoading(true);
    (async () => {
      const { data: payment } = await getVerifiedRoomPayment(target.allocationId);
      if (!payment) {
        setProblem("This student has no verified room payment yet. Verify their payment first.");
        setBunks([]);
        setLoading(false);
        return;
      }
      setTierName(payment.hostel_fee_tiers.name);
      const { data } = await listAvailableBunks(payment.hostel_fee_tiers.eligible_room_categories);
      const preferred = data.filter((b) => b.rooms.id === payment.room_id);
      setBunks([...preferred, ...data.filter((b) => b.rooms.id !== payment.room_id)]);
      if (preferred[0]) setBunkId(preferred[0].id);
      if (data.length === 0) setProblem("No matching bunks are free right now.");
      setLoading(false);
    })();
  }, [target]);

  const submit = async () => {
    if (!target || !bunkId) return;
    setSaving(true);
    const { data, error } = await assignBunk(target.allocationId, bunkId, notes);
    setSaving(false);
    if (error) {
      toast({ title: "Could not assign bunk", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Bunk assigned",
      description: `${target.studentName} → ${data?.block_name}, room ${data?.room_number}, bunk ${data?.bunk_number}`,
    });
    onAssigned();
  };

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign bunk</DialogTitle>
          <DialogDescription>
            {target?.studentName}
            {tierName && ` · paid ${tierName}`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading available bunks…</p>
        ) : problem && bunks.length === 0 ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{problem}</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bunk</label>
              <Select value={bunkId} onValueChange={setBunkId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a free bunk" />
                </SelectTrigger>
                <SelectContent>
                  {bunks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {bunkLabel(b)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only bunks covered by the student&apos;s payment are listed. The room they chose is shown first.
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="assign-notes" className="text-sm font-medium">
                Notes (optional)
              </label>
              <Textarea id="assign-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={!bunkId || saving}>
                {saving ? "Assigning…" : "Assign bunk"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BunkAssignDialog;
