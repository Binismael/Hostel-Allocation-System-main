import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AccountCredentials } from "@/lib/student-registration";

interface AccountCredentialsFieldsProps {
  value: AccountCredentials;
  onChange: (value: AccountCredentials) => void;
}

const AccountCredentialsFields = ({
  value,
  onChange,
}: AccountCredentialsFieldsProps) => {
  const update =
    (field: keyof AccountCredentials) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange({ ...value, [field]: e.target.value });

  const emailMismatch =
    value.confirmEmail.length > 0 &&
    value.email.trim().toLowerCase() !==
      value.confirmEmail.trim().toLowerCase();
  const passwordMismatch =
    value.confirmPassword.length > 0 &&
    value.password !== value.confirmPassword;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="reg-email">Email address *</Label>
        <Input
          id="reg-email"
          type="email"
          autoComplete="email"
          value={value.email}
          onChange={update("email")}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-confirm-email">Confirm email address *</Label>
        <Input
          id="reg-confirm-email"
          type="email"
          autoComplete="email"
          value={value.confirmEmail}
          onChange={update("confirmEmail")}
          aria-invalid={emailMismatch}
          aria-describedby={emailMismatch ? "reg-email-error" : undefined}
          required
        />
        {emailMismatch && (
          <p id="reg-email-error" className="text-xs text-destructive">
            Email addresses do not match
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password">Password *</Label>
        <Input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          value={value.password}
          onChange={update("password")}
          required
        />
        <p className="text-xs text-muted-foreground">At least 6 characters</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-confirm-password">Confirm password *</Label>
        <Input
          id="reg-confirm-password"
          type="password"
          autoComplete="new-password"
          value={value.confirmPassword}
          onChange={update("confirmPassword")}
          aria-invalid={passwordMismatch}
          aria-describedby={passwordMismatch ? "reg-password-error" : undefined}
          required
        />
        {passwordMismatch && (
          <p id="reg-password-error" className="text-xs text-destructive">
            Passwords do not match
          </p>
        )}
      </div>
    </div>
  );
};

export default AccountCredentialsFields;
