import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Landmark, Send } from "lucide-react";
import StudentLayout from "@/components/layouts/StudentLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getRoom, getStudentByEmail } from "@/lib/supabase-db";
import {
  emptyTransferDetails,
  findTier,
  getFeeTiers,
  HOSTEL_ACCOUNT,
  submitBankTransfer,
  validateTransfer,
  type FeeTier,
  type PaymentType,
} from "@/lib/payments";
import PaymentTypeSelector from "@/components/student/payment/PaymentTypeSelector";
import TransferDetailsFields from "@/components/student/payment/TransferDetailsFields";
import EmailAuthorization from "@/components/student/payment/EmailAuthorization";
import { getSettings, type Settings } from "@/lib/settings";

const Payment = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room") ?? "";

  const [room, setRoom] = useState<any>(null);
  const [tiers, setTiers] = useState<FeeTier[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [type, setType] = useState<PaymentType>(
    roomId ? "room_fee" : "room_exemption",
  );
  const [details, setDetails] = useState(emptyTransferDetails);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedReference, setSubmittedReference] = useState("");
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    getFeeTiers().then(({ data }) => setTiers(data));
    getSettings().then(({ data }) => {
      setSettings(data);
      setDetails((prev) => ({
        ...prev,
        recipientAccountNumber: prev.recipientAccountNumber || data.bank_account_number,
        recipientAccountName: prev.recipientAccountName || data.bank_account_name,
      }));
    });
  }, []);

  const account = {
    accountName: settings?.bank_account_name || HOSTEL_ACCOUNT.accountName,
    accountNumber: settings?.bank_account_number || HOSTEL_ACCOUNT.accountNumber,
    bankName: settings?.bank_name || HOSTEL_ACCOUNT.bankName,
  };

  useEffect(() => {
    if (!roomId) return;
    getRoom(roomId).then(({ data }) => setRoom(data));
  }, [roomId]);

  useEffect(() => {
    if (!user?.email) return;
    getStudentByEmail(user.email).then(({ data }) =>
      setStudentId(data?.id ?? null),
    );
  }, [user?.email]);

  const roomTier = room ? findTier(tiers, "room_fee", room.room_category) : undefined;
  const exemptionTier = findTier(tiers, "room_exemption");
  const selectedTier = type === "room_fee" ? roomTier : exemptionTier;

  const roomLabel = room
    ? `${room.blocks?.name ?? "Hostel"} · Room ${room.room_number} (${room.room_category ?? "standard"})`
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateTransfer(
      type,
      room?.id ?? "",
      details,
      receipt,
    );
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!selectedTier) {
      setError("This fee is not available right now. Please contact the hostel office.");
      return;
    }
    if (!authorized) {
      setError("Authorize this payment with the code sent to your email");
      return;
    }
    if (!studentId) {
      setError("Your student profile could not be found. Please log in again.");
      return;
    }

    setError("");
    setSubmitting(true);
    const { data, error: submitError } = await submitBankTransfer({
      studentId,
      tierCode: selectedTier.code,
      roomId: type === "room_fee" ? room.id : null,
      details,
      receipt: receipt!,
    });
    setSubmitting(false);

    if (submitError) {
      if (submitError.expired) setAuthorized(false);
      setError(submitError.message);
      return;
    }
    setSubmittedReference(data?.payment_reference ?? details.referenceId);
  };

  if (submittedReference) {
    return (
      <StudentLayout>
        <Card className="mx-auto max-w-xl border border-green-300 bg-green-50 p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-600" />
          <h2 className="text-2xl font-bold text-foreground">
            Payment submitted
          </h2>
          <p className="mt-2 text-muted-foreground">
            Payment{" "}
            <span className="font-semibold text-foreground">
              {submittedReference}
            </span>{" "}
            is waiting for the hostel office to verify it. You&apos;ll be
            notified once your room is assigned.
          </p>
          <Button asChild className="mt-6">
            <Link to="/student/allocation-status">View allocation status</Link>
          </Button>
        </Card>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Payment</h2>
          <p className="mt-1 text-muted-foreground">
            Pay by bank transfer, then submit your transfer details for
            verification.
          </p>
        </div>

        {account.accountNumber && (
          <Card className="flex items-start gap-3 border border-primary/40 bg-primary/5 p-4">
            <Landmark className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">Pay to</p>
              <p className="text-muted-foreground">
                {account.accountName} · {account.accountNumber}
                {account.bankName ? ` · ${account.bankName}` : ""}
              </p>
              {settings?.payment_instructions && (
                <p className="mt-1 text-muted-foreground">{settings.payment_instructions}</p>
              )}
              {settings?.allocation_deadline && (
                <p className="mt-1 font-medium text-foreground">
                  Deadline: {new Date(settings.allocation_deadline).toLocaleDateString()}
                </p>
              )}
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Card className="space-y-8 border border-border p-6">
            <section className="space-y-3" aria-labelledby="pay-type-heading">
              <h3
                id="pay-type-heading"
                className="text-base font-semibold text-foreground"
              >
                What are you paying for?
              </h3>
              <PaymentTypeSelector
                value={type}
                onChange={setType}
                roomLabel={roomLabel}
                roomFee={roomTier?.amount ?? null}
                exemptionFee={exemptionTier?.amount ?? null}
              />
            </section>

            <TransferDetailsFields
              amount={selectedTier?.amount ?? null}
              value={details}
              onChange={setDetails}
              receipt={receipt}
              onReceiptChange={setReceipt}
            />

            <section className="space-y-3" aria-labelledby="pay-auth-heading">
              <h3
                id="pay-auth-heading"
                className="text-base font-semibold text-foreground"
              >
                Email authorization
              </h3>
              {user?.email && (
                <EmailAuthorization
                  email={user.email}
                  verified={authorized}
                  onVerified={() => setAuthorized(true)}
                />
              )}
            </section>

            {error && (
              <div
                role="alert"
                className="flex gap-3 rounded-lg border border-red-300 bg-red-100 p-4"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full gap-2 sm:w-auto"
              disabled={submitting}
            >
              <Send className="h-4 w-4" />
              {submitting ? "Submitting..." : "Submit payment"}
            </Button>
          </Card>
        </form>
      </div>
    </StudentLayout>
  );
};

export default Payment;
