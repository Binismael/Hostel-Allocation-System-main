import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PERMISSIONS, type AdminRole, type Permission } from "@/lib/admin-access";

interface Props {
  role: AdminRole;
  permissions: Permission[];
  onRoleChange: (role: AdminRole) => void;
  onPermissionsChange: (permissions: Permission[]) => void;
  allowSuperAdmin: boolean;
}

const optionClass =
  "flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5";

const AccessFields = ({ role, permissions, onRoleChange, onPermissionsChange, allowSuperAdmin }: Props) => {
  const toggle = (key: Permission, checked: boolean) =>
    onPermissionsChange(checked ? [...permissions, key] : permissions.filter((p) => p !== key));

  return (
    <div className="space-y-4">
      <RadioGroup
        value={role}
        onValueChange={(v) => onRoleChange(v as AdminRole)}
        className="grid gap-2 sm:grid-cols-2"
      >
        <Label htmlFor="role-admin" className={optionClass}>
          <RadioGroupItem id="role-admin" value="admin" className="mt-0.5" />
          <span>
            <span className="block font-semibold">Admin</span>
            <span className="block text-xs font-normal text-muted-foreground">Only the areas you choose</span>
          </span>
        </Label>
        <Label htmlFor="role-super" className={optionClass}>
          <RadioGroupItem id="role-super" value="super_admin" className="mt-0.5" disabled={!allowSuperAdmin} />
          <span>
            <span className="block font-semibold">Super admin</span>
            <span className="block text-xs font-normal text-muted-foreground">Full access to everything</span>
          </span>
        </Label>
      </RadioGroup>

      {role === "admin" && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Can manage</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {PERMISSIONS.map((p) => (
              <label
                key={p.key}
                htmlFor={`perm-${p.key}`}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-secondary/30"
              >
                <Checkbox
                  id={`perm-${p.key}`}
                  checked={permissions.includes(p.key)}
                  onCheckedChange={(c) => toggle(p.key, c === true)}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium">{p.label}</span>
                  <span className="block text-xs text-muted-foreground">{p.description}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Every admin can view the dashboard and records; these control what they can change.</p>
        </fieldset>
      )}
    </div>
  );
};

export default AccessFields;
