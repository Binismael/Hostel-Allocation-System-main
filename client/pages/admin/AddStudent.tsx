import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { signupStudentAccount, upsertStudent } from "@/lib/supabase-db";
import {
  emptyCredentials,
  emptyStudentDetails,
  generateStudentId,
  toStudentRecord,
  validateRegistration,
} from "@/lib/student-registration";
import StudentDetailsFields from "@/components/student/StudentDetailsFields";
import AccountCredentialsFields from "@/components/student/AccountCredentialsFields";

const AddStudent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [details, setDetails] = useState(emptyStudentDetails);
  const [credentials, setCredentials] = useState(emptyCredentials);

  const showError = (description: string) =>
    toast({ title: "Error", description, variant: "destructive" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateRegistration(details, credentials);
    if (validationError) {
      showError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const email = credentials.email.trim().toLowerCase();
      const studentRecord = toStudentRecord(details, email);
      const { data: authData, error: authError } = await signupStudentAccount(
        email,
        credentials.password,
      );

      if (authError || !authData?.user?.id) {
        showError(
          authError?.message?.includes("already registered")
            ? "This email is already registered. Use Add Existing Student instead."
            : authError?.message || "Failed to create student account",
        );
        return;
      }

      const { error: studentError } = await upsertStudent({
        id: authData.user.id,
        student_id: generateStudentId(authData.user.id),
        ...studentRecord,
        status: "active",
      });

      if (studentError) {
        const message = studentError.message || "Failed to create student";
        showError(
          message.includes("duplicate") || message.includes("23505")
            ? "A student with this email already exists"
            : `Failed to add student record. ${message}`,
        );
        return;
      }

      toast({
        title: "Success",
        description: `Student ${studentRecord.name} has been added successfully.`,
      });
      navigate("/admin/students");
    } catch (error) {
      console.error("Add student error:", error);
      showError("Failed to add student. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            aria-label="Back to students"
            onClick={() => navigate("/admin/students")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Add New Student
            </h2>
            <p className="text-muted-foreground mt-1">
              Register a new student. A student ID is generated automatically.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <Card className="border border-border p-6 space-y-8 max-w-3xl">
            <fieldset className="space-y-4">
              <legend className="text-lg font-semibold text-foreground">
                Student details
              </legend>
              <StudentDetailsFields value={details} onChange={setDetails} />
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-lg font-semibold text-foreground">
                Login details
              </legend>
              <AccountCredentialsFields
                value={credentials}
                onChange={setCredentials}
              />
            </fieldset>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/students")}
              >
                Cancel
              </Button>
              <Button type="submit" className="gap-2" disabled={isLoading}>
                <Save className="w-4 h-4" />
                {isLoading ? "Saving..." : "Create student"}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AddStudent;
