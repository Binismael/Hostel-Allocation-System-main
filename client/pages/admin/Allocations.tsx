import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Check, X, Eye, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getAllocations, updateAllocation } from "@/lib/supabase-db";
import { supabase } from "@/lib/supabase";

const Allocations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllocations = async () => {
      try {
        setLoading(true);
        const { data, error } = await getAllocations();
        if (error) {
          toast({
            title: "Error",
            description: "Failed to load allocations",
            variant: "destructive",
          });
        } else {
          const formattedData = (data || []).map((alloc: any) => ({
            id: alloc.allocation_id,
            studentName: alloc.students?.name || "Unknown",
            studentId: alloc.students?.student_id || "N/A",
            room: alloc.rooms?.room_number || null,
            block: alloc.rooms?.blocks?.name || null,
            requestDate: alloc.request_date,
            allocatedDate: alloc.allocated_date,
            status: alloc.status,
            dbId: alloc.id,
            studentDbId: alloc.student_id,
          }));
          setAllocations(formattedData);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load allocations",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAllocations();
  }, [toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredAllocations = allocations.filter((alloc) => {
    const matchSearch =
      alloc.studentName.toLowerCase().includes(search.toLowerCase()) ||
      alloc.id.toLowerCase().includes(search.toLowerCase()) ||
      alloc.studentId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || alloc.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Allocations</h2>
            <p className="text-muted-foreground mt-1">
              Manage room allocations and student requests
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              className="gap-2 bg-primary hover:bg-primary/90"
              onClick={() => navigate("/admin/allocations/add")}
            >
              <Plus className="w-4 h-4" />
              New Allocation
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 border border-border">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or allocation ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </Card>

        {/* Allocations Table */}
        <Card className="border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Allocation ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Room
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Request Date
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
                        Loading allocations...
                      </p>
                    </td>
                  </tr>
                ) : filteredAllocations.length > 0 ? (
                  filteredAllocations.map((allocation) => (
                    <tr
                      key={allocation.id}
                      className="border-b border-border hover:bg-secondary/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-foreground">
                            {allocation.id}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-foreground">
                            {allocation.studentName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {allocation.studentId}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {allocation.room ? (
                          <div>
                            <p className="font-medium">{allocation.room}</p>
                            <p className="text-xs text-muted-foreground">
                              {allocation.block}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {allocation.requestDate}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${getStatusColor(
                            allocation.status,
                          )}`}
                        >
                          {allocation.status === "approved"
                            ? "✓ Approved"
                            : allocation.status === "pending"
                              ? "⏳ Pending"
                              : "✗ Rejected"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-secondary"
                            onClick={() =>
                              navigate(
                                `/admin/allocations/view/${allocation.dbId}`,
                              )
                            }
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {allocation.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-green-100/30 text-green-600"
                                onClick={async () => {
                                  try {
                                    const { data: roomRequest } = await supabase
                                      .from("room_requests")
                                      .select("semester")
                                      .eq("student_id", allocation.studentDbId)
                                      .order("submitted_at", {
                                        ascending: false,
                                      })
                                      .limit(1)
                                      .single();

                                    const { error } = await updateAllocation(
                                      allocation.dbId,
                                      {
                                        status: "approved",
                                        allocated_date: new Date()
                                          .toISOString()
                                          .split("T")[0],
                                        semester: roomRequest?.semester || null,
                                      },
                                    );
                                    if (error) {
                                      toast({
                                        title: "Error",
                                        description:
                                          "Failed to approve allocation",
                                        variant: "destructive",
                                      });
                                    } else {
                                      toast({
                                        title: "Success",
                                        description: `Allocation ${allocation.id} approved for ${allocation.studentName}`,
                                      });
                                      setAllocations(
                                        allocations.map((a: any) =>
                                          a.dbId === allocation.dbId
                                            ? { ...a, status: "approved" }
                                            : a,
                                        ),
                                      );
                                    }
                                  } catch (error) {
                                    toast({
                                      title: "Error",
                                      description:
                                        "Failed to approve allocation",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                                title="Approve allocation"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-100/30 text-red-600"
                                onClick={async () => {
                                  if (
                                    confirm(
                                      `Are you sure you want to reject allocation ${allocation.id}?`,
                                    )
                                  ) {
                                    const { error } = await updateAllocation(
                                      allocation.dbId,
                                      {
                                        status: "rejected",
                                      },
                                    );
                                    if (error) {
                                      toast({
                                        title: "Error",
                                        description:
                                          "Failed to reject allocation",
                                        variant: "destructive",
                                      });
                                    } else {
                                      toast({
                                        title: "Success",
                                        description: `Allocation ${allocation.id} rejected`,
                                      });
                                      setAllocations(
                                        allocations.map((a: any) =>
                                          a.dbId === allocation.dbId
                                            ? { ...a, status: "rejected" }
                                            : a,
                                        ),
                                      );
                                    }
                                  }
                                }}
                                title="Reject allocation"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <p className="text-muted-foreground">
                        No allocations found
                      </p>
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

export default Allocations;
