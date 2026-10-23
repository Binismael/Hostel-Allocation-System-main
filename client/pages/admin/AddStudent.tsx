import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createStudent, signupStudentAccount } from "@/lib/supabase-db";

const AddStudent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accountMode, setAccountMode] = useState<"create" | "link">("create");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    studentId: "",
    semester: "1",
    gender: "",
    dateOfBirth: "",
    address: "",
    parentName: "",
    parentPhone: "",
    enrollmentDate: new Date().toISOString().split("T")[0],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.studentId
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (accountMode === "create") {
      if (!formData.password || !formData.confirmPassword) {
        toast({
          title: "Validation Error",
          description: "Please provide password and confirm password",
          variant: "destructive",
        });
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Validation Error",
          description: "Passwords do not match",
          variant: "destructive",
        });
        return;
      }

      if (formData.password.length < 6) {
        toast({
          title: "Validation Error",
          description: "Password must be at least 6 characters long",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      let userId: string | null = null;

      if (accountMode === "create") {
        const { data: authData, error: authError } = await signupStudentAccount(
          formData.email,
          formData.password,
        );

        if (authError) {
          if (authError.message?.includes("already registered")) {
            toast({
              title: "Error",
              description:
                "This email is already registered. Use 'Link Existing Account' mode instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Account Creation Error",
              description:
                authError.message || "Failed to create student account",
              variant: "destructive",
            });
          }
          setIsLoading(false);
          return;
        } else if (authData?.user?.id) {
          userId = authData.user.id;
        }
      }

      const studentRecord: any = {
        student_id: formData.studentId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        semester: parseInt(formData.semester),
        gender: formData.gender || null,
        date_of_birth: formData.dateOfBirth || null,
        address: formData.address || null,
        parent_name: formData.parentName || null,
        parent_phone: formData.parentPhone || null,
        enrollment_date: formData.enrollmentDate,
        status: "active",
      };

      if (userId) {
        studentRecord.id = userId;
      }

      const { error: studentError } = await createStudent(studentRecord);

      if (studentError) {
        const errorMsg =
          (typeof studentError === "string"
            ? studentError
            : studentError?.message) || "Failed to create student record";

        console.error("Student creation error:", errorMsg);

        if (errorMsg.includes("duplicate") || errorMsg.includes("23505")) {
          toast({
            title: "Error",
            description: "A student with this ID or email already exists",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to add student record. " + errorMsg,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Success",
          description: `Student ${formData.name} has been added successfully.`,
        });

        setTimeout(() => {
          navigate("/admin/students");
        }, 1500);
      }
    } catch (error) {
      console.error("Add student error:", error);
      toast({
        title: "Error",
        description: "Failed to add student. Please try again.",
        variant: "destructive",
      });
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
            onClick={() => navigate("/admin/students")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Add New Student
            </h2>
            <p className="text-muted-foreground mt-1">
              Register a new student in the system
            </p>
          </div>
        </div>

        {/* rest of the JSX remains unchanged */}
      </div>
    </AdminLayout>
  );
};

export default AddStudent;
