import { useEffect, useState } from "react";
import { Banknote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { getAllFeeTiers, updateFeeTier, type FeeTierRow } from "@/lib/settings";

const FeeTierEditor = () => {
  const { toast } = useToast();
  const [tiers, setTiers] = useState<FeeTierRow[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    getAllFeeTiers().then(({ data }) => setTiers(data));
  }, []);

  const patch = (id: string, changes: Partial<FeeTierRow>) =>
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)));

  const save = async (tier: FeeTierRow) => {
    if (!tier.name.trim() || !(tier.amount > 0)) {
      toast({ title: "Enter a name and an amount above zero", variant: "destructive" });
      return;
    }
    setSavingId(tier.id);
    const { error } = await updateFeeTier(tier.id, {
      name: tier.name.trim(),
      amount: tier.amount,
      is_active: tier.is_active,
    });
    setSavingId(null);
    toast(
      error
        ? { title: "Could not save fee", description: error.message, variant: "destructive" }
        : { title: `${tier.name} saved` },
    );
  };

  return (
    <Card className="border border-border p-6">
      <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Banknote className="h-5 w-5" />
        Hostel fees
      </h3>
      <p className="mb-6 text-sm text-muted-foreground">
        Students pay these amounts. Changes apply to new payments only.
      </p>
      <div className="space-y-4">
        {tiers.map((tier) => (
          <div key={tier.id} className="grid items-end gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_10rem_auto_auto]">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Name · covers {tier.eligible_room_categories.length ? tier.eligible_room_categories.join(", ") : "no room (exemption)"}
              </label>
              <Input value={tier.name} onChange={(e) => patch(tier.id, { name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Amount (₦)</label>
              <Input
                type="number"
                min={1}
                value={tier.amount}
                onChange={(e) => patch(tier.id, { amount: Number(e.target.value) })}
              />
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <Switch checked={tier.is_active} onCheckedChange={(v) => patch(tier.id, { is_active: v })} />
              Active
            </label>
            <Button variant="outline" disabled={savingId === tier.id} onClick={() => save(tier)}>
              {savingId === tier.id ? "Saving…" : "Save"}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default FeeTierEditor;
