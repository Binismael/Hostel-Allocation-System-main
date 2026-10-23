import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, LogIn, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { createStudent, getStudentByEmail } from "@/lib/supabase-db";
import { useToast } from "@/components/ui/use-toast";

const StudentLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      // Attempt login
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      let user = signInData?.user;

      // If login fails, try signup
      if (signInError) {
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { role: "student" },
            },
          });

        if (signUpError) {
          setError(signUpError.message || "Authentication failed");
          setLoading(false);
          return;
        }

        user = signUpData.user;

        toast({
          title: "Account created",
          description: "Please check your email to confirm your account.",
        });
      }

      if (!user?.id) {
        setError("Authentication failed");
        setLoading(false);
        return;
      }

      // Ensure student record exists
      const { data: existingStudent } = await getStudentByEmail(email);

      if (!existingStudent) {
        const nameParts = email.split("@")[0].split(".");
        const firstName = nameParts[0] || "Student";
        const lastName = nameParts[1] || "";

        await createStudent({
          id: user.id,
          name: `${firstName} ${lastName}`.trim(),
          email,
          student_id: `STU-${user.id.substring(0, 8).toUpperCase()}`,
          phone: "",
        });
      }

      toast({
        title: "Success",
        description: "Logged in successfully!",
      });

      navigate("/student/room-request");
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground font-heading">
            HallMS
          </h1>
          <p className="text-muted-foreground mt-2">
            Hostel Allocation Management System
          </p>
        </div>

        {/* Login Card */}
        <Card className="border border-border p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex gap-3 p-4 rounded-lg bg-red-100 border border-red-300">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <LogIn className="w-4 h-4" />
              {loading ? "Processing..." : "Login"}
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Are you an admin?{" "}
            <Link
              to="/admin/login"
              className="text-primary hover:underline font-medium"
            >
              Go to Admin Panel
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
