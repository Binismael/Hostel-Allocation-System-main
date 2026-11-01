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
  HOSTEL_ACCOUNT,
  submitPayment,
  validateTransfer,
  type PaymentType,
} from "@/lib/payments";
import PaymentTypeSelector from "@/components/student/payment/PaymentTypeSelector";
import TransferDetailsFields from "@/components/student/payment/TransferDetailsFields";
import EmailAuthorization from "@/components/student/payment/EmailAuthorization";

const Payment = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("room") ?? "";

  const [room, setRoom] = useState<any>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [type, setType] = useState<PaymentType>(
    roomId ? "room_fee" : "room_exemption",
  );
  const [details, setDetails] = useState(emptyTransferDetails);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedReference, setSubmittedReference] = useState("");

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

  const roomLabel = room
    ? `${room.blocks?.name ?? "Hostel"} · Room ${room.room_number} (${room.room_category ?? "standard"})`
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateTransfer(type, room?.id ?? "", details);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!authorized) {
      setError("Authorize this payment with the code sent to your email");
      return;
    }
    if (!studentId || !user?.email) {
      setError("Your student profile could not be found. Please log in again.");
      return;
    }

    setError("");
    setSubmitting(true);
    const { error: submitError } = await submitPayment({
      studentId,
      email: user.email,
      roomId: room?.id ?? "",
      type,
      details,
    });
    setSubmitting(false);

    if (!submitError) {
      setSubmittedReference(details.referenceId.trim());
      return;
    }
    if (submitError.code === "23505") {
      setError("This reference ID has already been submitted.");
    } else if (submitError.code === "42501") {
      setAuthorized(false);
      setError(
        "Your email authorization has expired. Send a new code and try again.",
      );
    } else if (
      submitError.code === "42P01" ||
      submitError.code === "PGRST205"
    ) {
      setError(
        "Online payment submission isn't available yet. Please contact the hostel office.",
      );
    } else {
      setError(submitError.message || "Could not submit your payment.");
    }
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
            Reference{" "}
            <span className="font-semibold text-foreground">
              {submittedReference}
            </span>{" "}
            is pending confirmation by the hostel office.
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
            confirmation.
          </p>
        </div>

        {HOSTEL_ACCOUNT.accountNumber && (
          <Card className="flex items-start gap-3 border border-primary/40 bg-primary/5 p-4">
            <Landmark className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">Pay to</p>
              <p className="text-muted-foreground">
                {HOSTEL_ACCOUNT.accountName} · {HOSTEL_ACCOUNT.accountNumber}
                {HOSTEL_ACCOUNT.bankName ? ` · ${HOSTEL_ACCOUNT.bankName}` : ""}
              </p>
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
              />
            </section>

            <TransferDetailsFields
              type={type}
              value={details}
              onChange={setDetails}
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
