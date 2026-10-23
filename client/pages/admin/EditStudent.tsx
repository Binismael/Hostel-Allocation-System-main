import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getStudent, updateStudent, deleteStudent } from "@/lib/supabase-db";

const EditStudent = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    studentId: "",
    semester: "1",
    gender: "",
    dateOfBirth: "",
    address: "",
    parentName: "",
    parentPhone: "",
    enrollmentDate: "",
    status: "active",
  });

  useEffect(() => {
    const loadStudentData = async () => {
      if (!studentId) return;
      try {
        setLoadingData(true);
        const { data, error } = await getStudent(studentId);
        if (error) {
          toast({
            title: "Error",
            description: "Failed to load student details",
            variant: "destructive",
          });
          navigate("/admin/students");
        } else if (data) {
          setFormData({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            studentId: data.student_id || "",
            semester: (data.semester || 1).toString(),
            gender: data.gender || "",
            dateOfBirth: data.date_of_birth || "",
            address: data.address || "",
            parentName: data.parent_name || "",
            parentPhone: data.parent_phone || "",
            enrollmentDate: data.enrollment_date || "",
            status: data.status || "active",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load student details",
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadStudentData();
  }, [studentId, navigate, toast]);

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

    if (!studentId) return;
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

    setIsLoading(true);
    try {
      const { error } = await updateStudent(studentId, {
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
        enrollment_date: formData.enrollmentDate || null,
        status: formData.status,
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update student. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Student ${formData.name} has been updated successfully`,
        });

        setTimeout(() => {
          navigate("/admin/students");
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!studentId) return;
    if (
      !confirm(
        `Are you sure you want to delete student ${formData.name}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await deleteStudent(studentId);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete student",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Student ${formData.name} has been deleted`,
        });
        setTimeout(() => {
          navigate("/admin/students");
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading student details...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/admin/students")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-foreground">Edit Student</h2>
            <p className="text-muted-foreground mt-1">Update student details</p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-6 border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Full Name *
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="border border-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Student ID *
                  </label>
                  <Input
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    placeholder="STU-001"
                    className="border border-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Email *
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@university.edu"
                    className="border border-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Phone *
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className="border border-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Semester
                  </label>
                  <Select
                    value={formData.semester}
                    onValueChange={(value) =>
                      handleSelectChange("semester", value)
                    }
                  >
                    <SelectTrigger className="border border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <SelectItem key={sem} value={sem.toString()}>
                          Semester {sem}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Status
                  </label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      handleSelectChange("status", value)
                    }
                  >
                    <SelectTrigger className="border border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="graduated">Graduated</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Gender
                  </label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      handleSelectChange("gender", value)
                    }
                  >
                    <SelectTrigger className="border border-input">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="border border-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Enrollment Date
                  </label>
                  <Input
                    type="date"
                    name="enrollmentDate"
                    value={formData.enrollmentDate}
                    onChange={handleChange}
                    className="border border-input"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Contact & Guardian Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Address
                  </label>
                  <Textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter student's address"
                    className="border border-input"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Parent/Guardian Name
                    </label>
                    <Input
                      name="parentName"
                      value={formData.parentName}
                      onChange={handleChange}
                      placeholder="Parent name"
                      className="border border-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Parent/Guardian Phone
                    </label>
                    <Input
                      type="tel"
                      name="parentPhone"
                      value={formData.parentPhone}
                      onChange={handleChange}
                      placeholder="+1 (555) 987-6543"
                      className="border border-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 justify-between pt-4 border-t border-border">
              <Button
                type="button"
                variant="destructive"
                className="gap-2"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4" />
                Delete Student
              </Button>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/students")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="gap-2 bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default EditStudent;
