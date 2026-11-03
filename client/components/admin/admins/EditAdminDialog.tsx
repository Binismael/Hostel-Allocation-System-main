import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { updateAdminAccess, type AdminProfile, type AdminRole, type Permission } from "@/lib/admin-access";
import AccessFields from "./AccessFields";

interface Props {
  admin: AdminProfile | null;
  allowSuperAdmin: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const EditAdminDialog = ({ admin, allowSuperAdmin, onClose, onSaved }: Props) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminRole>("admin");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!admin) return;
    setName(admin.name);
    setRole(admin.role);
    setPermissions(admin.permissions);
    setActive(admin.is_active);
    setError("");
  }, [admin]);

  const submit = async () => {
    if (!admin) return;
    if (role === "admin" && permissions.length === 0 && active) {
      setError("Choose at least one area, or turn off access.");
      return;
    }
    setSaving(true);
    const { error: saveError } = await updateAdminAccess(admin.id, { name, role, permissions, is_active: active });
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    toast({ title: "Access updated", description: `${name}'s access has been saved.` });
    onSaved();
  };

  return (
    <Dialog open={!!admin} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit access</DialogTitle>
          <DialogDescription>{admin?.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="edit-admin-name" className="text-sm font-medium">Full name</label>
            <Input id="edit-admin-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <label className="flex items-center justify-between rounded-lg border border-border p-3">
            <span>
              <span className="block text-sm font-medium">Account active</span>
              <span className="block text-xs text-muted-foreground">Turn off to block this admin from logging in</span>
            </span>
            <Switch checked={active} onCheckedChange={setActive} />
          </label>
          <AccessFields
            role={role}
            permissions={permissions}
            onRoleChange={setRole}
            onPermissionsChange={setPermissions}
            allowSuperAdmin={allowSuperAdmin}
          />
          {error && (
            <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Save access"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditAdminDialog;
