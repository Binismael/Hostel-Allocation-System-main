import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Landmark, Save, Settings as SettingsIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import FeeTierEditor from "@/components/admin/settings/FeeTierEditor";
import { emptySettings, getSettings, saveSettings, type SettingKey } from "@/lib/settings";

const Field = ({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-medium text-foreground">
      {label}
    </label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings().then(({ data }) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const set = (key: SettingKey) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setSettings((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings.bank_account_number && !/^\d{10}$/.test(settings.bank_account_number.trim())) {
      toast({ title: "Account number must be 10 digits", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await saveSettings(settings);
    setSaving(false);
    toast(
      error
        ? { title: "Could not save settings", description: error.message, variant: "destructive" }
        : { title: "Settings saved" },
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Settings</h2>
          <p className="mt-1 text-muted-foreground">
            Session details, payment account and hostel fees shown to students.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card className="space-y-5 border border-border p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <SettingsIcon className="h-5 w-5" />
              Session
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="academic_session" label="Academic session">
                <Input
                  id="academic_session"
                  placeholder="e.g. 2025/2026"
                  value={settings.academic_session}
                  onChange={set("academic_session")}
                  disabled={loading}
                />
              </Field>
              <Field id="allocation_deadline" label="Payment / allocation deadline">
                <Input
                  id="allocation_deadline"
                  type="date"
                  value={settings.allocation_deadline}
                  onChange={set("allocation_deadline")}
                  disabled={loading}
                />
              </Field>
            </div>
          </Card>

          <Card className="space-y-5 border border-border p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Landmark className="h-5 w-5" />
              Payment account
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="bank_account_name" label="Account name">
                <Input
                  id="bank_account_name"
                  value={settings.bank_account_name}
                  onChange={set("bank_account_name")}
                  disabled={loading}
                />
              </Field>
              <Field id="bank_account_number" label="Account number" hint="10-digit NUBAN">
                <Input
                  id="bank_account_number"
                  inputMode="numeric"
                  maxLength={10}
                  value={settings.bank_account_number}
                  onChange={set("bank_account_number")}
                  disabled={loading}
                />
              </Field>
              <Field id="bank_name" label="Bank">
                <Input id="bank_name" value={settings.bank_name} onChange={set("bank_name")} disabled={loading} />
              </Field>
            </div>
            <Field id="payment_instructions" label="Payment instructions (optional)">
              <Textarea
                id="payment_instructions"
                rows={3}
                placeholder="e.g. Use your Student ID as the transfer narration."
                value={settings.payment_instructions}
                onChange={set("payment_instructions")}
                disabled={loading}
              />
            </Field>
          </Card>

          <Button type="submit" className="gap-2" disabled={saving || loading}>
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </form>

        <FeeTierEditor />
      </div>
    </AdminLayout>
  );
};

export default Settings;
