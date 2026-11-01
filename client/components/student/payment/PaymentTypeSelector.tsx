import { Link } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatNaira, type PaymentType } from "@/lib/payments";

interface PaymentTypeSelectorProps {
  value: PaymentType;
  onChange: (value: PaymentType) => void;
  roomLabel: string | null;
  roomFee: number | null;
  exemptionFee: number | null;
}

const optionClassName =
  "flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 has-[:checked]:border-primary has-[:checked]:bg-primary/5";

const PaymentTypeSelector = ({
  value,
  onChange,
  roomLabel,
  roomFee,
  exemptionFee,
}: PaymentTypeSelectorProps) => (
  <RadioGroup
    value={value}
    onValueChange={(v) => onChange(v as PaymentType)}
    className="grid grid-cols-1 gap-3 md:grid-cols-2"
  >
    <Label htmlFor="type-room-fee" className={optionClassName}>
      <RadioGroupItem id="type-room-fee" value="room_fee" className="mt-0.5" />
      <span className="space-y-1">
        <span className="block font-semibold text-foreground">
          Room fee{roomFee !== null ? ` · ${formatNaira(roomFee)}` : ""}
        </span>
        <span className="block text-sm font-normal text-muted-foreground">
          {roomLabel ? (
            roomLabel
          ) : (
            <>
              No room selected.{" "}
              <Link
                to="/student/hostel-directory"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Choose a room
              </Link>
            </>
          )}
        </span>
      </span>
    </Label>

    <Label htmlFor="type-exemption" className={optionClassName}>
      <RadioGroupItem
        id="type-exemption"
        value="room_exemption"
        className="mt-0.5"
      />
      <span className="space-y-1">
        <span className="block font-semibold text-foreground">
          Room exemption
          {exemptionFee !== null ? ` · ${formatNaira(exemptionFee)}` : ""}
        </span>
        <span className="block text-sm font-normal text-muted-foreground">
          Fixed fee to be exempted from hostel accommodation
        </span>
      </span>
    </Label>
  </RadioGroup>
);

export default PaymentTypeSelector;
