import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BedDouble, Edit2, Trash2, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import StatusBadge from "@/components/StatusBadge";
import BunkAssignDialog, { type AssignTarget } from "@/components/admin/allocations/BunkAssignDialog";
import ReleaseAllocationDialog, { type ReleaseTarget } from "@/components/admin/allocations/ReleaseAllocationDialog";
import { getAllocation, deleteAllocation } from "@/lib/supabase-db";
import { hasVerifiedRoomPayment } from "@/lib/admin-workflow";

const ViewAllocationDetails = () => {
  const navigate = useNavigate();
  const { allocationId } = useParams<{ allocationId: string }>();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [allocation, setAllocation] = useState<any>(null);
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<ReleaseTarget | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
  }, [allocationId, toast, navigate, reloadKey]);

  const reload = () => {
    setAssignTarget(null);
    setReleaseTarget(null);
    setReloadKey((k) => k + 1);
  };

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

  const paid = hasVerifiedRoomPayment(allocation);
  const canAssign = allocation.status === "approved" || (paid && allocation.status === "pending");
  const payment = allocation.hostel_payments?.[0];
  const studentName = allocation.students?.name || "Student";

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
            {!allocation.bunk_id && !payment && (
              <Button
                variant="destructive"
                className="gap-2"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
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
              <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
                <StatusBadge status={paid && allocation.status === "pending" ? "waitlisted" : allocation.status} />
                <span className="text-muted-foreground">
                  Payment:{" "}
                  {payment
                    ? `${payment.payment_reference} · ${payment.hostel_fee_tiers?.name ?? ""}`
                    : "none submitted"}
                </span>
                {payment && <StatusBadge status={payment.status} />}
              </div>

              <div className="flex flex-wrap gap-2">
                {canAssign && (
                  <Button
                    variant="outline"
                    className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => setAssignTarget({ allocationId: allocation.id, studentName })}
                  >
                    <BedDouble className="h-4 w-4" />
                    {allocation.bunk_id ? "Move to another bunk" : "Assign bunk"}
                  </Button>
                )}
                {allocation.status !== "rejected" && (
                  <Button
                    variant="outline"
                    className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() =>
                      setReleaseTarget({ allocationId: allocation.id, studentName, hasBunk: !!allocation.bunk_id })
                    }
                  >
                    <XCircle className="h-4 w-4" />
                    {allocation.bunk_id ? "Release bunk" : "Reject"}
                  </Button>
                )}
              </div>
              {!paid && allocation.status === "pending" && (
                <p className="mt-3 text-sm text-muted-foreground">
                  A bunk can be assigned after the student&apos;s room payment is verified.
                </p>
              )}
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
                    {allocation.rooms
                      ? `${allocation.rooms.blocks?.name ?? ""} · Room ${allocation.rooms.room_number}`
                      : "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bunk</p>
                  <p className="text-lg font-semibold text-foreground">
                    {allocation.bunks
                      ? `${allocation.bunks.bunk_number} (${allocation.bunks.level})`
                      : "Not assigned"}
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

      <BunkAssignDialog target={assignTarget} onClose={() => setAssignTarget(null)} onAssigned={reload} />
      <ReleaseAllocationDialog target={releaseTarget} onClose={() => setReleaseTarget(null)} onReleased={reload} />
    </AdminLayout>
  );
};

export default ViewAllocationDetails;
