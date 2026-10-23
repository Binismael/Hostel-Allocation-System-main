import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2, Trash2, Check, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  getAllocation,
  deleteAllocation,
  updateAllocation,
} from "@/lib/supabase-db";

const ViewAllocationDetails = () => {
  const navigate = useNavigate();
  const { allocationId } = useParams<{ allocationId: string }>();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [allocation, setAllocation] = useState<any>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadAllocationDetails = async () => {
      if (!allocationId) {
        toast({
          title: "Error",
          description: "Allocation ID is required",
          variant: "destructive",
        });
        navigate("/admin/allocations");
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await getAllocation(allocationId);
        if (error) {
          toast({
            title: "Error",
            description: "Failed to load allocation details",
            variant: "destructive",
          });
          navigate("/admin/allocations");
        } else if (data) {
          setAllocation(data);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load allocation details",
          variant: "destructive",
        });
        navigate("/admin/allocations");
      } finally {
        setIsLoading(false);
      }
    };

    loadAllocationDetails();
  }, [allocationId, toast, navigate]);

  const handleEdit = () => {
    navigate(`/admin/allocations/edit/${allocationId}`);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete this allocation?`)) {
      return;
    }

    try {
      const { error } = await deleteAllocation(allocationId || "");
      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete allocation",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Allocation has been deleted`,
        });
        setTimeout(() => {
          navigate("/admin/allocations");
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete allocation",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const { error } = await updateAllocation(allocationId || "", {
        status: newStatus,
      });
      if (error) {
        toast({
          title: "Error",
          description: "Failed to update status",
          variant: "destructive",
        });
      } else {
        setAllocation({ ...allocation, status: newStatus });
        toast({
          title: "Success",
          description: `Allocation status updated to ${newStatus}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading allocation details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!allocation) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Allocation not found</p>
        </div>
      </AdminLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <Check className="w-4 h-4" />;
      case "rejected":
        return <X className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/admin/allocations")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                {allocation.allocation_id}
              </h2>
              <p className="text-muted-foreground mt-1">
                Allocation details and status
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleEdit}>
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Details Card */}
        <Card className="p-6 border border-border">
          <div className="space-y-6">
            {/* Status Section */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Allocation Status
              </h3>
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${getStatusColor(
                    allocation.status,
                  )}`}
                >
                  {getStatusIcon(allocation.status)}
                  {allocation.status.charAt(0).toUpperCase() +
                    allocation.status.slice(1)}
                </div>
              </div>

              {/* Status Update Buttons */}
              <div className="flex gap-2">
                {allocation.status !== "approved" && (
                  <Button
                    variant="outline"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => handleStatusChange("approved")}
                    disabled={isUpdatingStatus}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                )}
                {allocation.status !== "rejected" && (
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => handleStatusChange("rejected")}
                    disabled={isUpdatingStatus}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                )}
                {allocation.status !== "pending" && (
                  <Button
                    variant="outline"
                    className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                    onClick={() => handleStatusChange("pending")}
                    disabled={isUpdatingStatus}
                  >
                    Pending
                  </Button>
                )}
              </div>
            </div>

            {/* Student Information */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Student Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Student Name</p>
                  <p className="text-lg font-semibold text-foreground">
                    {allocation.students?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-lg font-semibold text-foreground">
                    {allocation.students?.email || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Semester</p>
                  <p className="text-lg font-semibold text-foreground">
                    {allocation.semester
                      ? `Semester ${allocation.semester}`
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Room Information */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Room Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Room</p>
                  <p className="text-lg font-semibold text-foreground">
                    {allocation.rooms?.block_id}-
                    {allocation.rooms?.room_number || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="text-lg font-semibold text-foreground">
                    {allocation.rooms?.capacity || "N/A"} beds
                  </p>
                </div>
              </div>
            </div>

            {/* Allocation Details */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Allocation Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Request Date</p>
                  <p className="text-lg font-semibold text-foreground">
                    {allocation.request_date || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Allocated Date
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {allocation.allocated_date || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <p className="text-lg font-semibold text-foreground capitalize">
                    {allocation.priority || "Normal"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reason</p>
                  <p className="text-lg font-semibold text-foreground capitalize">
                    {allocation.reason || "Regular Allocation"}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {allocation.notes && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Notes
                </h3>
                <div className="bg-secondary/30 rounded-lg p-4">
                  <p className="text-foreground whitespace-pre-wrap">
                    {allocation.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/allocations")}
          >
            Back to Allocations
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ViewAllocationDetails;
