import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import StudentLayout from "@/components/layouts/StudentLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Save, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  getStudent,
  updateStudent,
  getStudentByEmail,
} from "@/lib/supabase-db";
import { supabase } from "@/lib/supabase";

const StudentProfile = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    student_id: "",
    semester: "1",
    program: "",
    date_of_birth: "",
    gender: "",
    nationality: "",
    address: "",
    emergency_contact: "",
    emergency_phone: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);

        if (!user?.email) {
          toast({
            title: "Error",
            description: "User not authenticated",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Get student by current user's email
        const { data, error } = await getStudentByEmail(user.email);

        if (error || !data) {
          toast({
            title: "Error",
            description: "Failed to load student profile",
            variant: "destructive",
          });
        } else {
          setStudentId(data.id);
          setFormData({
            name: data.name || "",
            email: data.email || "",
            phone: data.phone || "",
            student_id: data.student_id || "",
            semester: (data.semester || "1").toString(),
            program: data.program || "",
            date_of_birth: data.date_of_birth || "",
            gender: data.gender || "",
            nationality: data.nationality || "",
            address: data.address || "",
            emergency_contact: data.emergency_contact || "",
            emergency_phone: data.emergency_phone || "",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load student profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user?.email) {
      loadProfile();
    }
  }, [user?.email, authLoading, toast]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!studentId) return;

    setSaving(true);
    try {
      const { error } = await updateStudent(studentId, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        semester: parseInt(formData.semester),
        program: formData.program,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        nationality: formData.nationality || null,
        address: formData.address || null,
        emergency_contact: formData.emergency_contact || null,
        emergency_phone: formData.emergency_phone || null,
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save profile changes",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        setIsEditing(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile changes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground">My Profile</h2>
            <p className="text-muted-foreground mt-1">
              Loading your profile...
            </p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const initials = formData.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">My Profile</h2>
            <p className="text-muted-foreground mt-1">
              View and manage your student profile
            </p>
          </div>
          <Button
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            className="gap-2 bg-primary hover:bg-primary/90"
            disabled={saving}
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        {/* Profile Header */}
        <Card className="border border-border p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-4xl font-bold text-primary">
                {initials}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-foreground">
                {formData.name}
              </h3>
              <p className="text-muted-foreground">{formData.student_id}</p>
              <div className="mt-4 flex gap-4 flex-wrap text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Program</p>
                  <p className="font-semibold text-foreground">
                    {formData.program || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Semester</p>
                  <p className="font-semibold text-foreground">
                    {formData.semester}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-semibold text-foreground">Active</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {isEditing && (
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 flex gap-3">
            <div className="flex-1">
              <p className="text-sm text-blue-800">
                You are now editing your profile. Make changes and click "Save
                Changes" to update your information.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="hover:bg-blue-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Personal Information */}
        <Card className="border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              {isEditing ? (
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              ) : (
                <p className="px-4 py-2 bg-secondary/30 rounded-lg text-foreground">
                  {formData.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              {isEditing ? (
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              ) : (
                <p className="px-4 py-2 bg-secondary/30 rounded-lg text-foreground">
                  {formData.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              {isEditing ? (
                <Input
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
              ) : (
                <p className="px-4 py-2 bg-secondary/30 rounded-lg text-foreground">
                  {formData.phone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Date of Birth
              </label>
              {isEditing ? (
                <Input
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                />
              ) : (
                <p className="px-4 py-2 bg-secondary/30 rounded-lg text-foreground">
                  {formData.date_of_birth || "Not specified"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Gender
              </label>
              {isEditing ? (
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="px-4 py-2 bg-secondary/30 rounded-lg text-foreground">
                  {formData.gender || "Not specified"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nationality
              </label>
              {isEditing ? (
                <Input
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                />
              ) : (
                <p className="px-4 py-2 bg-secondary/30 rounded-lg text-foreground">
                  {formData.nationality || "Not specified"}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Address
              </label>
              {isEditing ? (
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              ) : (
                <p className="px-4 py-2 bg-secondary/30 rounded-lg text-foreground">
                  {formData.address || "Not specified"}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Academic Information */}
        <Card className="border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Academic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Student ID
              </label>
              <p className="px-4 py-2 bg-secondary/30 rounded-lg text-foreground">
                {formData.student_id}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Program
              </label>
              {isEditing ? (
                <Input
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                />
              ) : (
                <p className="px-4 py-2 bg-secondary/30 rounded-lg text-foreground">
                  {formData.program || "Not specified"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Current Semester
              </label>
              {isEditing ? (
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                </select>
              ) : (
                <p className="px-4 py-2 bg-secondary/30 rounded-lg text-foreground">
                  {formData.semester}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Emergency Contact */}
        <Card className="border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Emergency Contact
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Contact Name
              </label>
              {isEditing ? (
                <Input
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={handleChange}
                />
              ) : (
                <p className="px-4 py-2 bg-secondary/30 rounded-lg text-foreground">
                  {formData.emergency_contact || "Not specified"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Contact Phone
              </label>
              {isEditing ? (
                <Input
                  name="emergency_phone"
                  type="tel"
                  value={formData.emergency_phone}
                  onChange={handleChange}
                />
              ) : (
                <p className="px-4 py-2 bg-secondary/30 rounded-lg text-foreground">
                  {formData.emergency_phone || "Not specified"}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </StudentLayout>
  );
};

export default StudentProfile;
