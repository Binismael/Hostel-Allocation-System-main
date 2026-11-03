import { Landmark, Zap } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PaymentMethod } from "@/lib/paystack";

interface Props {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  paystackAvailable: boolean;
}

const optionClassName =
  "flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60";

const PaymentMethodSelector = ({ value, onChange, paystackAvailable }: Props) => (
  <RadioGroup
    value={value}
    onValueChange={(v) => onChange(v as PaymentMethod)}
    className="grid grid-cols-1 gap-3 md:grid-cols-2"
  >
    <Label htmlFor="method-paystack" className={optionClassName}>
      <RadioGroupItem id="method-paystack" value="paystack" className="mt-0.5" disabled={!paystackAvailable} />
      <span className="space-y-1">
        <span className="flex items-center gap-1.5 font-semibold text-foreground">
          <Zap className="h-4 w-4 text-primary" /> Pay online with Paystack
        </span>
        <span className="block text-sm font-normal text-muted-foreground">
          {paystackAvailable
            ? "Card, bank transfer or USSD. Confirmed instantly — your bunk is assigned right away."
            : "Online payment is not available yet."}
        </span>
      </span>
    </Label>

    <Label htmlFor="method-bank" className={optionClassName}>
      <RadioGroupItem id="method-bank" value="bank_transfer" className="mt-0.5" />
      <span className="space-y-1">
        <span className="flex items-center gap-1.5 font-semibold text-foreground">
          <Landmark className="h-4 w-4 text-primary" /> Bank transfer
        </span>
        <span className="block text-sm font-normal text-muted-foreground">
          Transfer to the hostel account and upload your receipt for the office to verify.
        </span>
      </span>
    </Label>
  </RadioGroup>
);

export default PaymentMethodSelector;
