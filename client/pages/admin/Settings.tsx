import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    academicYear: "2024/2025",
    allocationDeadline: "2024-02-01",
    maxRequestsPerStudent: "3",
    enableAutoAllocation: true,
    sendEmailNotifications: true,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("hallms_settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem("hallms_settings", JSON.stringify(settings));

      toast({
        title: "Success",
        description: "Settings saved successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold text-foreground">Settings</h2>
          <p className="text-muted-foreground mt-1">
            Manage system configuration and preferences
          </p>
        </div>

        {/* System Settings */}
        <Card className="border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            System Settings
          </h3>

          <div className="space-y-6">
            {/* Academic Year */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Academic Year
              </label>
              <Input
                type="text"
                placeholder="e.g., 2024/2025"
                value={settings.academicYear}
                onChange={(e) =>
                  handleInputChange("academicYear", e.target.value)
                }
              />
            </div>

            {/* Allocation Deadline */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Allocation Deadline
              </label>
              <Input
                type="date"
                value={settings.allocationDeadline}
                onChange={(e) =>
                  handleInputChange("allocationDeadline", e.target.value)
                }
              />
            </div>

            {/* Max Requests per Student */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Maximum Requests per Student
              </label>
              <Input
                type="number"
                placeholder="3"
                value={settings.maxRequestsPerStudent}
                onChange={(e) =>
                  handleInputChange("maxRequestsPerStudent", e.target.value)
                }
              />
            </div>

            {/* Auto Allocation */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableAutoAllocation}
                  onChange={(e) =>
                    handleInputChange("enableAutoAllocation", e.target.checked)
                  }
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm font-medium text-foreground">
                  Enable Auto-Allocation
                </span>
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Automatically allocate rooms to students based on preferences
              </p>
            </div>

            {/* Email Notifications */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.sendEmailNotifications}
                  onChange={(e) =>
                    handleInputChange(
                      "sendEmailNotifications",
                      e.target.checked,
                    )
                  }
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm font-medium text-foreground">
                  Send Email Notifications
                </span>
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Send notifications when allocations are approved or rejected
              </p>
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={loading}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Save className="w-4 h-4" />
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </Card>

        {/* System Information */}
        <Card className="border border-border p-6 bg-secondary/30">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            System Information
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">System Version</span>
              <span className="font-medium text-foreground">v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-medium text-foreground">2024-01-15</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Users</span>
              <span className="font-medium text-foreground">342</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Rooms</span>
              <span className="font-medium text-foreground">243</span>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Settings;
