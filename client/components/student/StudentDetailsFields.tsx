import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StudentDetails } from "@/lib/student-registration";

interface StudentDetailsFieldsProps {
  value: StudentDetails;
  onChange: (value: StudentDetails) => void;
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const StudentDetailsFields = ({ value, onChange }: StudentDetailsFieldsProps) => {
  const update =
    (field: keyof StudentDetails) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...value, [field]: e.target.value });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="reg-name">Full name *</Label>
        <Input
          id="reg-name"
          autoComplete="name"
          value={value.name}
          onChange={update("name")}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-phone">Phone number *</Label>
        <Input
          id="reg-phone"
          type="tel"
          autoComplete="tel"
          value={value.phone}
          onChange={update("phone")}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-gender">Gender *</Label>
        <select
          id="reg-gender"
          className={selectClassName}
          value={value.gender}
          onChange={update("gender")}
          required
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-dob">Date of birth</Label>
        <Input
          id="reg-dob"
          type="date"
          value={value.dateOfBirth}
          onChange={update("dateOfBirth")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-nationality">Nationality</Label>
        <Input
          id="reg-nationality"
          value={value.nationality}
          onChange={update("nationality")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-program">Program / department *</Label>
        <Input
          id="reg-program"
          value={value.program}
          onChange={update("program")}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-semester">Semester</Label>
        <select
          id="reg-semester"
          className={selectClassName}
          value={value.semester}
          onChange={update("semester")}
        >
          {["1", "2", "3", "4", "5", "6", "7", "8"].map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="reg-address">Home address</Label>
        <Input
          id="reg-address"
          autoComplete="street-address"
          value={value.address}
          onChange={update("address")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-emergency-name">Emergency contact name</Label>
        <Input
          id="reg-emergency-name"
          value={value.emergencyContact}
          onChange={update("emergencyContact")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-emergency-phone">Emergency contact phone</Label>
        <Input
          id="reg-emergency-phone"
          type="tel"
          value={value.emergencyPhone}
          onChange={update("emergencyPhone")}
        />
      </div>
    </div>
  );
};

export default StudentDetailsFields;
