import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  formatNaira,
  ROOM_EXEMPTION_FEE,
  type PaymentType,
  type TransferDetails,
} from "@/lib/payments";

interface TransferDetailsFieldsProps {
  type: PaymentType;
  value: TransferDetails;
  onChange: (value: TransferDetails) => void;
}

const TransferDetailsFields = ({
  type,
  value,
  onChange,
}: TransferDetailsFieldsProps) => {
  const update =
    (field: keyof TransferDetails) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...value, [field]: e.target.value });

  return (
    <div className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-foreground">
          Recipient account
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pay-recipient-number">
              Recipient account number *
            </Label>
            <Input
              id="pay-recipient-number"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit account number"
              value={value.recipientAccountNumber}
              onChange={(e) =>
                onChange({
                  ...value,
                  recipientAccountNumber: e.target.value.replace(/\D/g, ""),
                })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-recipient-name">Recipient account name *</Label>
            <Input
              id="pay-recipient-name"
              value={value.recipientAccountName}
              onChange={update("recipientAccountName")}
              required
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-foreground">
          Transfer details
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pay-amount">Amount (₦) *</Label>
            {type === "room_exemption" ? (
              <Input
                id="pay-amount"
                value={formatNaira(ROOM_EXEMPTION_FEE)}
                readOnly
                aria-readonly="true"
                className="bg-muted"
              />
            ) : (
              <Input
                id="pay-amount"
                type="number"
                inputMode="decimal"
                min={1}
                value={value.amount}
                onChange={update("amount")}
                required
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-date">Transfer date *</Label>
            <Input
              id="pay-date"
              type="date"
              max={new Date().toISOString().split("T")[0]}
              value={value.transferDate}
              onChange={update("transferDate")}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-payer-name">Sender account name *</Label>
            <Input
              id="pay-payer-name"
              value={value.payerName}
              onChange={update("payerName")}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-payer-bank">Sender bank *</Label>
            <Input
              id="pay-payer-bank"
              value={value.payerBank}
              onChange={update("payerBank")}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-session-id">Session ID *</Label>
            <Input
              id="pay-session-id"
              placeholder="From your transfer receipt"
              value={value.sessionId}
              onChange={update("sessionId")}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pay-reference-id">Reference ID *</Label>
            <Input
              id="pay-reference-id"
              placeholder="From your transfer receipt"
              value={value.referenceId}
              onChange={update("referenceId")}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pay-remarks">Remarks</Label>
            <Textarea
              id="pay-remarks"
              placeholder="E.g. hostel fee for first semester"
              value={value.remarks}
              onChange={update("remarks")}
              maxLength={500}
            />
          </div>
        </div>
      </fieldset>
    </div>
  );
};

export default TransferDetailsFields;
