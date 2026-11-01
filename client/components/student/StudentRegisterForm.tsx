import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { createStudent } from "@/lib/supabase-db";
import {
  emptyCredentials,
  emptyStudentDetails,
  generateStudentId,
  toStudentRecord,
  validateRegistration,
} from "@/lib/student-registration";
import StudentDetailsFields from "./StudentDetailsFields";
import AccountCredentialsFields from "./AccountCredentialsFields";

interface StudentRegisterFormProps {
  onAwaitingConfirmation: (email: string) => void;
}

const StudentRegisterForm = ({
  onAwaitingConfirmation,
}: StudentRegisterFormProps) => {
  const navigate = useNavigate();
  const [details, setDetails] = useState(emptyStudentDetails);
  const [credentials, setCredentials] = useState(emptyCredentials);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateRegistration(details, credentials);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setLoading(true);
    try {
      const email = credentials.email.trim().toLowerCase();
      const studentRecord = toStudentRecord(details, email);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: credentials.password,
        options: {
          data: { role: "student", student_details: studentRecord },
        },
      });

      if (signUpError) {
        setError(signUpError.message || "Could not create your account");
        return;
      }

      // Supabase hides existing accounts by returning a user with no identities.
      if (!data.user || data.user.identities?.length === 0) {
        setError("An account with this email already exists. Please log in.");
        return;
      }

      if (!data.session) {
        onAwaitingConfirmation(email);
        return;
      }

      const { error: studentError } = await createStudent({
        id: data.user.id,
        student_id: generateStudentId(data.user.id),
        ...studentRecord,
      });
      if (studentError) {
        setError(
          "Your account was created, but your student details could not be saved. Please log in to finish setup.",
        );
        return;
      }

      navigate("/student/room-request");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <div
          role="alert"
          className="flex gap-3 rounded-lg border border-red-300 bg-red-100 p-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-foreground">
          Student details
        </legend>
        <StudentDetailsFields value={details} onChange={setDetails} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-base font-semibold text-foreground">
          Login details
        </legend>
        <AccountCredentialsFields
          value={credentials}
          onChange={setCredentials}
        />
      </fieldset>

      <Button type="submit" className="w-full gap-2" disabled={loading}>
        <UserPlus className="h-4 w-4" />
        {loading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
};

export default StudentRegisterForm;
