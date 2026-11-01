import { useEffect, useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  sendAuthorizationCode,
  verifyAuthorizationCode,
} from "@/lib/payments";

interface EmailAuthorizationProps {
  email: string;
  verified: boolean;
  onVerified: () => void;
}

const RESEND_SECONDS = 60;

const EmailAuthorization = ({
  email,
  verified,
  onVerified,
}: EmailAuthorizationProps) => {
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSend = async () => {
    setBusy(true);
    setError("");
    const { error: sendError } = await sendAuthorizationCode(email);
    setBusy(false);
    if (sendError) {
      setError(sendError.message || "Could not send the code. Try again.");
      return;
    }
    setCodeSent(true);
    setCooldown(RESEND_SECONDS);
  };

  const handleVerify = async () => {
    setBusy(true);
    setError("");
    const { error: verifyError } = await verifyAuthorizationCode(
      email,
      code.trim(),
    );
    setBusy(false);
    if (verifyError) {
      setError("That code is incorrect or has expired. Request a new one.");
      return;
    }
    setCode("");
    onVerified();
  };

  if (verified) {
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 p-4"
      >
        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-700" />
        <p className="text-sm text-green-900">
          Payment authorized for <span className="font-semibold">{email}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex items-start gap-3">
        <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          We&apos;ll send a one-time code to{" "}
          <span className="font-semibold text-foreground">{email}</span> to
          authorize this payment.
        </p>
      </div>

      {codeSent && (
        <div className="space-y-2">
          <Label htmlFor="pay-auth-code">Confirmation code</Label>
          <Input
            id="pay-auth-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="max-w-48 tracking-widest"
          />
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        {codeSent && (
          <Button
            type="button"
            onClick={handleVerify}
            disabled={busy || code.trim().length < 6}
          >
            {busy ? "Verifying..." : "Verify code"}
          </Button>
        )}
        <Button
          type="button"
          variant={codeSent ? "outline" : "default"}
          onClick={handleSend}
          disabled={busy || cooldown > 0}
        >
          {cooldown > 0
            ? `Resend code in ${cooldown}s`
            : codeSent
              ? "Resend code"
              : "Send confirmation code"}
        </Button>
      </div>
    </div>
  );
};

export default EmailAuthorization;
