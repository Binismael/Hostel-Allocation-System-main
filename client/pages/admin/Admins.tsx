import { useCallback, useEffect, useState } from "react";
import { Pencil, UserPlus } from "lucide-react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import AddAdminDialog from "@/components/admin/admins/AddAdminDialog";
import EditAdminDialog from "@/components/admin/admins/EditAdminDialog";
import { listAdmins, PERMISSIONS, useAdminProfile, type AdminProfile } from "@/lib/admin-access";

const permissionLabel = (key: string) => PERMISSIONS.find((p) => p.key === key)?.label ?? key;

const Admins = () => {
  const { toast } = useToast();
  const { admin: me } = useAdminProfile();
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<AdminProfile | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await listAdmins();
    setLoading(false);
    if (error) {
      toast({ title: "Could not load admins", description: error.message, variant: "destructive" });
      return;
    }
    setAdmins(data);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const isSuper = me?.role === "super_admin";
  const canEdit = (a: AdminProfile) => a.id !== me?.id && (isSuper || a.role !== "super_admin");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Admins</h2>
            <p className="mt-1 text-muted-foreground">Who can manage the hostel system and what they can change.</p>
          </div>
          <Button className="gap-2" onClick={() => setAdding(true)}>
            <UserPlus className="h-4 w-4" /> Add admin
          </Button>
        </div>

        <Card className="overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-left">
                  <th className="px-6 py-4 font-semibold">Admin</th>
                  <th className="px-6 py-4 font-semibold">Access</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Loading admins…</td>
                  </tr>
                ) : (
                  admins.map((a) => (
                    <tr key={a.id} className="border-b border-border hover:bg-secondary/20">
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">
                          {a.name} {a.id === me?.id && <span className="text-xs text-muted-foreground">(you)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground">{a.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        {a.role === "super_admin" ? (
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            Super admin · full access
                          </span>
                        ) : a.permissions.length ? (
                          <div className="flex flex-wrap gap-1">
                            {a.permissions.map((p) => (
                              <span key={p} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-foreground">
                                {permissionLabel(p)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">View only</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            a.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {a.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {canEdit(a) && (
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => setEditing(a)}>
                            <Pencil className="h-3.5 w-3.5" /> Edit access
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <AddAdminDialog
        open={adding}
        allowSuperAdmin={isSuper}
        onClose={() => setAdding(false)}
        onCreated={() => {
          setAdding(false);
          load();
        }}
      />
      <EditAdminDialog
        admin={editing}
        allowSuperAdmin={isSuper}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    </AdminLayout>
  );
};

export default Admins;
