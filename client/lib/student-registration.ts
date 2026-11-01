export interface StudentDetails {
  name: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  program: string;
  semester: string;
  nationality: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
}

export interface AccountCredentials {
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
}

export const emptyStudentDetails: StudentDetails = {
  name: "",
  phone: "",
  gender: "",
  dateOfBirth: "",
  program: "",
  semester: "1",
  nationality: "",
  address: "",
  emergencyContact: "",
  emergencyPhone: "",
};

export const emptyCredentials: AccountCredentials = {
  email: "",
  confirmEmail: "",
  password: "",
  confirmPassword: "",
};

export function validateRegistration(
  details: StudentDetails,
  credentials: AccountCredentials,
): string | null {
  if (!details.name.trim() || !details.phone.trim() || !details.gender) {
    return "Please enter your full name, phone number, and gender";
  }
  if (!details.program.trim()) {
    return "Please enter your program or department";
  }
  const email = credentials.email.trim().toLowerCase();
  if (!email || !credentials.confirmEmail.trim()) {
    return "Please enter and confirm your email address";
  }
  if (email !== credentials.confirmEmail.trim().toLowerCase()) {
    return "Email addresses do not match";
  }
  if (credentials.password.length < 6) {
    return "Password must be at least 6 characters long";
  }
  if (credentials.password !== credentials.confirmPassword) {
    return "Passwords do not match";
  }
  return null;
}

export function generateStudentId(userId?: string) {
  const suffix = userId
    ? userId.substring(0, 8)
    : crypto.randomUUID().substring(0, 8);
  return `STU-${suffix.toUpperCase()}`;
}

const PROFILE_FIELDS = [
  "name",
  "phone",
  "gender",
  "date_of_birth",
  "program",
  "semester",
  "nationality",
  "address",
  "emergency_contact",
  "emergency_phone",
] as const;

export function pickProfileFields(source: Record<string, unknown> | null | undefined) {
  if (!source) return {};
  return Object.fromEntries(
    PROFILE_FIELDS.filter((key) => source[key] !== undefined).map((key) => [
      key,
      source[key],
    ]),
  );
}

export function toStudentRecord(details: StudentDetails, email: string) {
  return {
    name: details.name.trim(),
    email: email.trim().toLowerCase(),
    phone: details.phone.trim(),
    gender: details.gender || null,
    date_of_birth: details.dateOfBirth || null,
    program: details.program.trim() || null,
    semester: parseInt(details.semester),
    nationality: details.nationality.trim() || null,
    address: details.address.trim() || null,
    emergency_contact: details.emergencyContact.trim() || null,
    emergency_phone: details.emergencyPhone.trim() || null,
  };
}
