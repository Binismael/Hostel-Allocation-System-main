import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, LogIn, AlertCircle, MailCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { createStudent, getStudentByEmail } from "@/lib/supabase-db";
import { generateStudentId } from "@/lib/student-registration";
import { useToast } from "@/components/ui/use-toast";
import StudentRegisterForm from "@/components/student/StudentRegisterForm";

const StudentLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(
    searchParams.get("mode") === "register" ? "register" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError || !data.user) {
        setError(
          signInError?.message === "Email not confirmed"
            ? "Please confirm your email address before logging in."
            : "Incorrect email or password. New students should create an account first.",
        );
        return;
      }

      const user = data.user;
      const { data: existingStudent } = await getStudentByEmail(user.email!);

      if (!existingStudent) {
        const savedDetails = user.user_metadata?.student_details;
        const fallbackName = user.email!.split("@")[0].replace(/[._]/g, " ");

        await createStudent({
          phone: "",
          name: fallbackName,
          ...savedDetails,
          id: user.id,
          student_id: generateStudentId(user.id),
          email: user.email,
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

  const handleAwaitingConfirmation = (newEmail: string) => {
    setConfirmationEmail(newEmail);
    setEmail(newEmail);
    setTab("login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div
        className={`w-full transition-[max-width] ${tab === "register" ? "max-w-2xl" : "max-w-md"}`}
      >
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

        <Card className="border border-border p-6 sm:p-8">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-6">
                {confirmationEmail && (
                  <div
                    role="status"
                    className="flex gap-3 p-4 rounded-lg bg-green-50 border border-green-300"
                  >
                    <MailCheck className="w-5 h-5 text-green-700 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-900">
                      Account created. Check{" "}
                      <span className="font-semibold">{confirmationEmail}</span>{" "}
                      for a confirmation link, then log in here.
                    </p>
                  </div>
                )}

                {error && (
                  <div
                    role="alert"
                    className="flex gap-3 p-4 rounded-lg bg-red-100 border border-red-300"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="login-email">Email address</Label>
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={loading}
                >
                  <LogIn className="w-4 h-4" />
                  {loading ? "Processing..." : "Login"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <StudentRegisterForm
                onAwaitingConfirmation={handleAwaitingConfirmation}
              />
            </TabsContent>
          </Tabs>
        </Card>

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
