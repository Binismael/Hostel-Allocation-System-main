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
import { useToast } from "@/components/ui/use-toast";
import { createAdmin, type AdminRole, type Permission } from "@/lib/admin-access";
import AccessFields from "./AccessFields";

interface Props {
  open: boolean;
  allowSuperAdmin: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const AddAdminDialog = ({ open, allowSuperAdmin, onClose, onCreated }: Props) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("admin");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setEmail("");
    setPassword("");
    setRole("admin");
    setPermissions([]);
    setError("");
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a name and a valid email.");
      return;
    }
    if (password.length < 8) {
      setError("Temporary password must be at least 8 characters.");
      return;
    }
    if (role === "admin" && permissions.length === 0) {
      setError("Choose at least one area this admin can manage.");
      return;
    }
    setError("");
    setSaving(true);
    const { error: createError } = await createAdmin({ name: name.trim(), email: email.trim(), password, role, permissions });
    setSaving(false);
    if (createError) {
      setError(createError);
      return;
    }
    toast({ title: "Admin added", description: `${name.trim()} can now log in with the temporary password.` });
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add admin</DialogTitle>
          <DialogDescription>
            Share the temporary password with them privately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="admin-name" className="text-sm font-medium">Full name</label>
              <Input id="admin-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label htmlFor="admin-email" className="text-sm font-medium">Email</label>
              <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="admin-password" className="text-sm font-medium">Temporary password</label>
              <Input
                id="admin-password"
                type="text"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
          </div>
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
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Adding…" : "Add admin"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAdminDialog;
