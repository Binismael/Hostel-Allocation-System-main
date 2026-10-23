import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  MapPin,
  Users,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getStudent, deleteStudent } from "@/lib/supabase-db";

const ViewStudentDetails = () => {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    const loadStudentDetails = async () => {
      if (!studentId) {
        toast({
          title: "Error",
          description: "Student ID is required",
          variant: "destructive",
        });
        navigate("/admin/students");
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await getStudent(studentId);
        if (error) {
          toast({
            title: "Error",
            description: "Failed to load student details",
            variant: "destructive",
          });
          navigate("/admin/students");
        } else if (data) {
          setStudent(data);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load student details",
          variant: "destructive",
        });
        navigate("/admin/students");
      } finally {
        setIsLoading(false);
      }
    };

    loadStudentDetails();
  }, [studentId, toast, navigate]);

  const handleEdit = () => {
    navigate(`/admin/students/edit/${studentId}`);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete student ${student?.name}?`)) {
      return;
    }

    try {
      const { error } = await deleteStudent(studentId || "");
      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete student",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Student ${student?.name} has been deleted`,
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
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading student details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!student) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Student not found</p>
        </div>
      </AdminLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      case "graduated":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
                {student.name}
              </h2>
              <p className="text-muted-foreground mt-1">
                Student ID: {student.student_id}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleEdit}>
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="p-6 border border-border lg:col-span-1">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {student.name}
              </h3>
              <p className="text-muted-foreground mb-4">{student.student_id}</p>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status || "active")}`}
              >
                {(student.status || "active").charAt(0).toUpperCase() +
                  (student.status || "active").slice(1)}
              </span>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{student.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{student.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">
                  Semester {student.semester || 1}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">
                  Enrolled: {student.enrollment_date || "N/A"}
                </span>
              </div>
            </div>
          </Card>

          {/* Details Card */}
          <Card className="p-6 border border-border lg:col-span-2">
            <div className="space-y-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium text-foreground capitalize">
                      {student.gender || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Date of Birth
                    </p>
                    <p className="font-medium text-foreground">
                      {student.date_of_birth || "N/A"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Address
                    </p>
                    <p className="font-medium text-foreground">
                      {student.address || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Guardian Information */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Guardian Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Parent/Guardian Name
                    </p>
                    <p className="font-medium text-foreground">
                      {student.parent_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Parent/Guardian Phone
                    </p>
                    <p className="font-medium text-foreground">
                      {student.parent_phone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={() => navigate("/admin/students")}>
            Back to Students
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ViewStudentDetails;
