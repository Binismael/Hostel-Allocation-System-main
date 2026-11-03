import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Building2,
  DoorOpen,
  FileText,
  Search,
  Eye,
  CreditCard,
  BedDouble,
  ClipboardList,
  Hourglass,
} from "lucide-react";
import { getAllocations } from "@/lib/supabase-db";
import { supabase } from "@/lib/supabase";
import { hasVerifiedRoomPayment } from "@/lib/admin-workflow";
import StatusBadge from "@/components/StatusBadge";

const count = (table: string, filter?: [string, string]) => {
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) q = q.eq(filter[0], filter[1]);
  return q;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchAllocation, setSearchAllocation] = useState("");
  const [stats, setStats] = useState<any[]>([]);
  const [workflow, setWorkflow] = useState<any[]>([]);
  const [recentAllocations, setRecentAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Get counts for stats
        const [
          { count: studentsCount },
          { count: blocksCount },
          { count: roomsCount },
          { count: allocationsCount },
          allocationsRes,
          { count: paymentsToReview },
          { count: freeBunks },
          { count: totalBunks },
          { count: pendingRequests },
        ] = await Promise.all([
          count("students"),
          count("blocks"),
          count("rooms"),
          count("allocations"),
          getAllocations(),
          count("hostel_payments", ["status", "submitted"]),
          count("bunks", ["status", "available"]),
          count("bunks"),
          count("room_requests", ["status", "pending"]),
        ]);

        const awaitingBunk = (allocationsRes.data || []).filter(
          (a: any) => a.status === "pending" && hasVerifiedRoomPayment(a),
        ).length;

        setWorkflow([
          { label: "Payments to review", value: paymentsToReview || 0, icon: CreditCard, href: "/admin/payments" },
          { label: "Paid, awaiting bunk", value: awaitingBunk, icon: Hourglass, href: "/admin/allocations?filter=awaiting" },
          { label: "Pending room requests", value: pendingRequests || 0, icon: ClipboardList, href: "/admin/room-requests" },
          { label: "Free bunks", value: `${freeBunks || 0} / ${totalBunks || 0}`, icon: BedDouble, href: "/admin/occupied-rooms" },
        ]);

        // Set stats
        setStats([
          {
            label: "Total Students",
            value: (studentsCount || 0).toString(),
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
          },
          {
            label: "Total Blocks",
            value: (blocksCount || 0).toString(),
            icon: Building2,
            color: "text-green-600",
            bgColor: "bg-green-50",
          },
          {
            label: "Total Rooms",
            value: (roomsCount || 0).toString(),
            icon: DoorOpen,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
          },
          {
            label: "Total Allocations",
            value: (allocationsCount || 0).toString(),
            icon: FileText,
            color: "text-amber-600",
            bgColor: "bg-amber-50",
          },
        ]);

        // Format recent allocations
        const allocations = allocationsRes.data || [];
        const formatted_allocations = allocations
          .slice(0, 5)
          .map((alloc: any) => ({
            dbId: alloc.id,
            id: alloc.allocation_id,
            studentName: alloc.students?.name || "Unknown",
            room: alloc.rooms?.room_number || "—",
            block: alloc.rooms?.blocks?.name || "—",
            status: alloc.status,
            date: alloc.request_date,
          }));
        setRecentAllocations(formatted_allocations);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredAllocations = recentAllocations.filter(
    (alloc) =>
      alloc.studentName
        .toLowerCase()
        .includes(searchAllocation.toLowerCase()) ||
      alloc.id.toLowerCase().includes(searchAllocation.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your hostel allocation overview.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array(4)
                .fill(0)
                .map((_, i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-12 w-12 bg-secondary rounded-lg mb-4"></div>
                    <div className="h-4 w-24 bg-secondary rounded mb-2"></div>
                    <div className="h-8 w-12 bg-secondary rounded"></div>
                  </Card>
                ))
            : stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="p-6 border border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm font-medium">
                          {stat.label}
                        </p>
                        <p className="text-3xl font-bold text-foreground mt-2">
                          {stat.value}
                        </p>
                      </div>
                      <div
                        className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                  </Card>
                );
              })}
        </div>

        {!loading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {workflow.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.href)}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{item.value}</p>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Recent Allocations Section */}
        <Card className="p-6 border border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold text-foreground">
              Recent Allocations
            </h3>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search allocations..."
                  value={searchAllocation}
                  onChange={(e) => setSearchAllocation(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                className="gap-2 bg-primary hover:bg-primary/90 whitespace-nowrap"
                onClick={() => navigate("/admin/payments")}
              >
                <CreditCard className="w-4 h-4" />
                Review payments
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Student Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Room
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Block
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Date
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="py-4 px-4">
                          <div className="h-4 w-32 bg-secondary rounded"></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-4 w-16 bg-secondary rounded"></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-4 w-20 bg-secondary rounded"></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-6 w-20 bg-secondary rounded-full"></div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="h-4 w-24 bg-secondary rounded"></div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="h-8 w-8 bg-secondary rounded ml-auto"></div>
                        </td>
                      </tr>
                    ))
                ) : filteredAllocations.length > 0 ? (
                  filteredAllocations.map((allocation) => (
                    <tr
                      key={allocation.id}
                      className="hover:bg-secondary/20 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-medium text-foreground">
                          {allocation.studentName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {allocation.id}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-foreground">
                        {allocation.room}
                      </td>
                      <td className="py-4 px-4 text-sm text-foreground">
                        {allocation.block}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={allocation.status} />
                      </td>
                      <td className="py-4 px-4 text-sm text-foreground">
                        {allocation.date}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="View details"
                          onClick={() => navigate(`/admin/allocations/view/${allocation.dbId}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No allocations found
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

export default Dashboard;
