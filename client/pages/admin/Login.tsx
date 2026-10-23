import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { createAdmin, getAdminByEmail } from "@/lib/supabase-db";
import { useToast } from "@/components/ui/use-toast";

const AdminLogin = () => {
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

      // If login fails, try signup (register new admin)
      if (signInError) {
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { role: "admin" },
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
          description: "Admin account registered successfully.",
        });
      }

      if (!user?.id) {
        setError("Authentication failed");
        setLoading(false);
        return;
      }

      // Check if admin record exists
      const { data: existingAdmin } = await getAdminByEmail(email);

      if (!existingAdmin) {
        // Create admin record
        await createAdmin({
          id: user.id,
          email,
          name: email.split("@")[0],
          created_at: new Date(),
        });
      }

      toast({
        title: "Success",
        description: "Logged in successfully!",
      });

      navigate("/admin/dashboard");
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
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F786bdffc3a15485695347a8b9132e919%2F77e19f0b98be40e5b6e0728fce58a4f3?format=webp&width=800"
              alt="FLC Logo"
              className="w-8 h-8"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground font-heading">
            FLC Admin
          </h1>
          <p className="text-muted-foreground mt-2">Hostel Management System</p>
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
                placeholder="admin@university.edu"
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
            Are you a student?{" "}
            <Link
              to="/student/login"
              className="text-primary hover:underline font-medium"
            >
              Go to Student Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
