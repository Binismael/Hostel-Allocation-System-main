import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  formatNaira,
  RECEIPT_TYPES,
  type TransferDetails,
} from "@/lib/payments";

interface TransferDetailsFieldsProps {
  amount: number | null;
  value: TransferDetails;
  onChange: (value: TransferDetails) => void;
  receipt: File | null;
  onReceiptChange: (file: File | null) => void;
}

const TransferDetailsFields = ({
  amount,
  value,
  onChange,
  receipt,
  onReceiptChange,
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
            <Label htmlFor="pay-amount">Amount</Label>
            <Input
              id="pay-amount"
              value={amount !== null ? formatNaira(amount) : "—"}
              readOnly
              aria-readonly="true"
              className="bg-muted"
            />
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
            <Label htmlFor="pay-receipt">Transfer receipt *</Label>
            <Input
              id="pay-receipt"
              type="file"
              accept={RECEIPT_TYPES.join(",")}
              onChange={(e) => onReceiptChange(e.target.files?.[0] ?? null)}
              aria-describedby="pay-receipt-hint"
              required
            />
            <p id="pay-receipt-hint" className="text-xs text-muted-foreground">
              {receipt
                ? `Selected: ${receipt.name}`
                : "JPG, PNG, or PDF, up to 5 MB"}
            </p>
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
