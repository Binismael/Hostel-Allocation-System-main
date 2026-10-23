import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FileText, User, DoorOpen, LogOut, Menu, X, File } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentLayoutProps {
  children: React.ReactNode;
}

const StudentLayout = ({ children }: StudentLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const navItems = [
    {
      label: "Allocation Status",
      href: "/student/allocation-status",
      icon: FileText,
    },
    {
      label: "Allocation Letter",
      href: "/student/allocation-letter",
      icon: File,
    },
    {
      label: "Room Request",
      href: "/student/room-request",
      icon: DoorOpen,
    },
    {
      label: "My Profile",
      href: "/student/profile",
      icon: User,
    },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-sidebar-background border-r border-sidebar-border transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center px-4 border-b border-sidebar-border">
          <Link
            to="/student/allocation-status"
            className="flex items-center justify-center"
          >
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2Fece4a38457b3429d9a1e0894c73e7ff5%2F4ecbbe642ea440d8b9b0f1335b69fa8f?format=webp&width=800"
              alt="Foreign Links Campus Logo"
              className={`object-contain ${sidebarOpen ? "w-12 h-12" : "w-10 h-10"}`}
            />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => (window.location.href = "/student/login")}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {sidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-primary bg-primary px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-white/10 text-white"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
            <h1 className="text-lg font-semibold text-white">Student Portal</h1>
          </div>

          {/* User Profile Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-sm font-semibold text-white">S</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">Student</p>
                <p className="text-xs text-white/70">STU-001</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-background to-secondary/10">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
