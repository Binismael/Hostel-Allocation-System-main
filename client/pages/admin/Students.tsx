import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreVertical, Edit2, Trash2, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getStudents, deleteStudent } from "@/lib/supabase-db";

const Students = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        const { data, error } = await getStudents();
        if (error) {
          toast({
            title: "Error",
            description: "Failed to load students",
            variant: "destructive",
          });
        } else {
          setStudents(data || []);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load students",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, [toast]);

  const filteredStudents = students
    .filter(
      (student) =>
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase()) ||
        student.student_id.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "semester") {
        return (b.semester || 0) - (a.semester || 0);
      }
      return 0;
    });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Students</h2>
            <p className="text-muted-foreground mt-1">
              Manage all registered students in the system
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate("/admin/students/add-existing")}
            >
              <Plus className="w-4 h-4" />
              Add Existing
            </Button>
            <Button
              className="gap-2 bg-primary hover:bg-primary/90"
              onClick={() => navigate("/admin/students/add")}
            >
              <Plus className="w-4 h-4" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 border border-border">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
            >
              <option value="name">Sort by Name</option>
              <option value="semester">Sort by Semester</option>
            </select>
          </div>
        </Card>

        {/* Students Table */}
        <Card className="border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Semester
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <p className="text-muted-foreground">
                        Loading students...
                      </p>
                    </td>
                  </tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-border hover:bg-secondary/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-foreground">
                            {student.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.student_id}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {student.phone}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        Semester {student.semester || 1}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
                            student.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {(student.status || "active")
                            .charAt(0)
                            .toUpperCase() +
                            (student.status || "active").slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-secondary"
                            onClick={() =>
                              navigate(`/admin/students/view/${student.id}`)
                            }
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-secondary"
                            onClick={() =>
                              navigate(`/admin/students/edit/${student.id}`)
                            }
                            title="Edit student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-100/30 text-red-600"
                            onClick={async () => {
                              if (
                                confirm(
                                  `Are you sure you want to delete student ${student.name}? This action cannot be undone.`,
                                )
                              ) {
                                const { error } = await deleteStudent(
                                  student.id,
                                );
                                if (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to delete student",
                                    variant: "destructive",
                                  });
                                } else {
                                  toast({
                                    title: "Success",
                                    description: `Student ${student.name} has been deleted`,
                                  });
                                  setStudents(
                                    students.filter((s) => s.id !== student.id),
                                  );
                                }
                              }
                            }}
                            title="Delete student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <p className="text-muted-foreground">No students found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Students;
