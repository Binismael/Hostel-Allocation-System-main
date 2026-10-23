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
import { ArrowLeft, Search, Upload, Users, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { createStudent } from "@/lib/supabase-db";

const AddExistingStudent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"search" | "batch" | "link">(
    "search",
  );
  const [isLoading, setIsLoading] = useState(false);

  // Search Tab
  const [searchEmail, setSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [searchError, setSearchError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    phone: "",
    semester: "1",
  });

  // Batch Tab
  const [batchEmails, setBatchEmails] = useState("");
  const [batchResults, setBatchResults] = useState<any[]>([]);

  // Link Tab
  const [linkEmail, setLinkEmail] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkedUsers, setLinkedUsers] = useState<any[]>([]);

  // Search for existing auth user
  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      setSearchError("Please enter an email");
      return;
    }

    setIsLoading(true);
    setSearchError("");
    setFoundUser(null);

    try {
      const response = await fetch(
        `/api/search-user?email=${encodeURIComponent(searchEmail)}`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          setSearchError("No user found with that email");
        } else {
          setSearchError("Failed to search users. Please try again.");
        }
        return;
      }

      const user = await response.json();

      // Check if already a student
      const { data: existingStudent } = await supabase
        .from("students")
        .select("*")
        .eq("id", user.id)
        .single();

      if (existingStudent) {
        setSearchError("This user is already registered as a student");
        return;
      }

      setFoundUser(user);
      setFormData({
        fullName: user.full_name || "",
        studentId: `STU-${user.id.substring(0, 8).toUpperCase()}`,
        phone: user.phone || "",
        semester: "1",
      });
    } catch (error) {
      setSearchError("Error searching for user");
    } finally {
      setIsLoading(false);
    }
  };

  // Add found user as student
  const handleAddFoundUser = async () => {
    if (!foundUser || !formData.fullName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await createStudent({
        id: foundUser.id,
        name: formData.fullName,
        email: foundUser.email,
        student_id: formData.studentId,
        phone: formData.phone,
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add student",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Student ${formData.fullName} added successfully`,
        });
        setFoundUser(null);
        setSearchEmail("");
        setFormData({
          fullName: "",
          studentId: "",
          phone: "",
          semester: "1",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add student",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Batch import
  const handleBatchImport = async () => {
    if (!batchEmails.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const emails = batchEmails
      .split("\n")
      .map((e) => e.trim())
      .filter((e) => e && e.includes("@"));

    const results = [];

    try {
      for (const email of emails) {
        try {
          const response = await fetch(
            `/api/search-user?email=${encodeURIComponent(email)}`,
          );

          if (!response.ok) {
            results.push({ email, status: "error", message: "User not found" });
            continue;
          }

          const user = await response.json();

          const { data: existingStudent } = await supabase
            .from("students")
            .select("*")
            .eq("id", user.id)
            .single();

          if (existingStudent) {
            results.push({
              email,
              status: "error",
              message: "Already registered as student",
            });
            continue;
          }

          const { error: createError } = await createStudent({
            id: user.id,
            name: user.full_name || email.split("@")[0],
            email: user.email,
            student_id: `STU-${user.id.substring(0, 8).toUpperCase()}`,
            phone: user.phone || "",
          });

          if (createError) {
            results.push({ email, status: "error", message: createError });
          } else {
            results.push({ email, status: "success", message: "Added" });
          }
        } catch (error) {
          results.push({
            email,
            status: "error",
            message: "Failed to process user",
          });
        }
      }

      setBatchResults(results);
      const successCount = results.filter((r) => r.status === "success").length;
      toast({
        title: "Batch Import Complete",
        description: `${successCount} of ${results.length} users added successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process batch import",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Link existing student records
  const handleLinkExistingStudent = async () => {
    if (!linkEmail.trim()) {
      setLinkError("Please enter an email");
      return;
    }

    setIsLoading(true);
    setLinkError("");

    try {
      const { data: student, error } = await supabase
        .from("students")
        .select("*")
        .eq("email", linkEmail.trim())
        .single();

      if (error || !student) {
        setLinkError("Student record not found with that email");
        return;
      }

      const { data: authUser, error: authError } =
        await supabase.auth.admin.getUserById(student.id);

      if (authError || !authUser) {
        // Try to find by email in auth
        const { data: allUsers } = await supabase.auth.admin.listUsers();
        const foundAuthUser = allUsers.users?.find(
          (u) => u.email?.toLowerCase() === linkEmail.toLowerCase(),
        );

        if (foundAuthUser) {
          setLinkedUsers([
            ...linkedUsers,
            {
              id: foundAuthUser.id,
              email: foundAuthUser.email,
              studentName: student.name,
              studentId: student.student_id,
              status: "linked",
            },
          ]);
          toast({
            title: "Success",
            description: `Linked auth account to student ${student.name}`,
          });
          setLinkEmail("");
        } else {
          setLinkError(
            "No auth account found. Student record exists but no login account.",
          );
        }
      } else {
        setLinkedUsers([
          ...linkedUsers,
          {
            id: student.id,
            email: linkEmail,
            studentName: student.name,
            studentId: student.student_id,
            status: "linked",
          },
        ]);
        toast({
          title: "Success",
          description: `Linked auth account to student ${student.name}`,
        });
        setLinkEmail("");
      }
    } catch (error) {
      setLinkError("Error linking student record");
    } finally {
      setIsLoading(false);
    }
  };

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
            <h2 className="text-3xl font-bold text-foreground">
              Add Existing Users
            </h2>
            <p className="text-muted-foreground mt-1">
              Link existing auth accounts to student records
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Card className="p-4 border border-border">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={activeTab === "search" ? "default" : "outline"}
              onClick={() => setActiveTab("search")}
              className="gap-2"
            >
              <Search className="w-4 h-4" />
              Search User
            </Button>
            <Button
              variant={activeTab === "batch" ? "default" : "outline"}
              onClick={() => setActiveTab("batch")}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Batch Import
            </Button>
            <Button
              variant={activeTab === "link" ? "default" : "outline"}
              onClick={() => setActiveTab("link")}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              Link Records
            </Button>
          </div>
        </Card>

        {/* Search Tab */}
        {activeTab === "search" && (
          <Card className="p-6 border border-border space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Search & Add User
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Find an existing auth account and create a student record
              </p>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter user email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchUser()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSearchUser}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Search
                  </Button>
                </div>

                {searchError && (
                  <div className="p-3 bg-red-50 border border-red-300 rounded-lg flex gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{searchError}</p>
                  </div>
                )}

                {foundUser && (
                  <div className="p-4 bg-green-50 border border-green-300 rounded-lg space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Found:</p>
                      <p className="font-semibold text-foreground">
                        {foundUser.email}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Full Name *
                        </label>
                        <Input
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fullName: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Student ID
                        </label>
                        <Input
                          value={formData.studentId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              studentId: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Phone
                        </label>
                        <Input
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-green-300">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFoundUser(null);
                          setSearchEmail("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddFoundUser}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Add Student
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Batch Import Tab */}
        {activeTab === "batch" && (
          <Card className="p-6 border border-border space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Batch Import Users
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Import multiple existing auth users at once. Enter one email per
                line.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Addresses (one per line) *
                  </label>
                  <Textarea
                    placeholder="user1@example.com
user2@example.com
user3@example.com"
                    value={batchEmails}
                    onChange={(e) => setBatchEmails(e.target.value)}
                    rows={8}
                  />
                </div>

                <Button
                  onClick={handleBatchImport}
                  disabled={isLoading || !batchEmails.trim()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isLoading ? "Importing..." : "Import"}
                </Button>

                {batchResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">Results:</h4>
                    {batchResults.map((result, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg flex justify-between items-center ${
                          result.status === "success"
                            ? "bg-green-50 border border-green-300"
                            : "bg-red-50 border border-red-300"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium">{result.email}</p>
                          <p
                            className={`text-xs ${
                              result.status === "success"
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            {result.message}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold ${
                            result.status === "success"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {result.status === "success" ? "✓" : "✗"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Link Records Tab */}
        {activeTab === "link" && (
          <Card className="p-6 border border-border space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Link Existing Records
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Link existing student records with auth accounts
              </p>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter student email"
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleLinkExistingStudent()
                    }
                    className="flex-1"
                  />
                  <Button
                    onClick={handleLinkExistingStudent}
                    disabled={isLoading}
                  >
                    Link
                  </Button>
                </div>

                {linkError && (
                  <div className="p-3 bg-red-50 border border-red-300 rounded-lg flex gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{linkError}</p>
                  </div>
                )}

                {linkedUsers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-foreground">Linked:</h4>
                    {linkedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="p-3 bg-green-50 border border-green-300 rounded-lg"
                      >
                        <p className="font-medium text-foreground">
                          {user.studentName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Email: {user.email} | ID: {user.studentId}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AddExistingStudent;
