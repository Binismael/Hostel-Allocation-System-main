import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getAllocation, updateAllocation, getRooms } from "@/lib/supabase-db";

const EditAllocation = () => {
  const navigate = useNavigate();
  const { allocationId } = useParams<{ allocationId: string }>();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAllocation, setIsLoadingAllocation] = useState(true);
  const [rooms, setRooms] = useState<any[]>([]);
  const [allocation, setAllocation] = useState<any>(null);
  const [formData, setFormData] = useState({
    roomId: "",
    allocationDate: "",
    checkInDate: "",
    priority: "normal",
    allocationReason: "regular",
    notes: "",
  });

  useEffect(() => {
    const loadData = async () => {
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
        setIsLoadingAllocation(true);
        const [allocationRes, roomsRes] = await Promise.all([
          getAllocation(allocationId),
          getRooms(),
        ]);

        if (allocationRes.error) {
          toast({
            title: "Error",
            description: "Failed to load allocation details",
            variant: "destructive",
          });
          navigate("/admin/allocations");
        } else if (allocationRes.data) {
          setAllocation(allocationRes.data);
          setFormData({
            roomId: allocationRes.data.room_id || "",
            allocationDate: allocationRes.data.allocated_date || "",
            checkInDate: allocationRes.data.check_in_date || "",
            priority: allocationRes.data.priority || "normal",
            allocationReason: allocationRes.data.reason || "regular",
            notes: allocationRes.data.notes || "",
          });
        }

        if (!roomsRes.error && roomsRes.data) {
          const formattedRooms = (roomsRes.data || []).map((room: any) => ({
            id: room.id,
            number: room.room_number,
            block_id: room.block_id,
            capacity: room.capacity,
          }));
          setRooms(formattedRooms);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load allocation details",
          variant: "destructive",
        });
        navigate("/admin/allocations");
      } finally {
        setIsLoadingAllocation(false);
      }
    };

    loadData();
  }, [allocationId, toast, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      const { error } = await updateAllocation(allocationId || "", {
        room_id: formData.roomId || null,
        allocated_date: formData.allocationDate,
        check_in_date: formData.checkInDate || null,
        priority: formData.priority,
        reason: formData.allocationReason,
        notes: formData.notes || null,
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update allocation. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Allocation has been updated successfully`,
        });

        setTimeout(() => {
          navigate("/admin/allocations");
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update allocation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingAllocation) {
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
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
              Edit Allocation
            </h2>
            <p className="text-muted-foreground mt-1">
              Update allocation details
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-6 border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Allocation Info */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Allocation Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Allocation ID
                  </label>
                  <Input
                    type="text"
                    value={allocation.allocation_id || ""}
                    disabled
                    className="border border-input bg-secondary/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Student
                  </label>
                  <Input
                    type="text"
                    value={allocation.students?.name || ""}
                    disabled
                    className="border border-input bg-secondary/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Assign Room *
                  </label>
                  <Select
                    value={formData.roomId}
                    onValueChange={(value) =>
                      handleSelectChange("roomId", value)
                    }
                  >
                    <SelectTrigger className="border border-input">
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.block_id}-{room.number} (Capacity: {room.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Semester
                  </label>
                  <Input
                    type="text"
                    value={
                      allocation.semester
                        ? `Semester ${allocation.semester}`
                        : "N/A"
                    }
                    disabled
                    className="border border-input bg-secondary/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Request Date
                  </label>
                  <Input
                    type="text"
                    value={allocation.request_date || ""}
                    disabled
                    className="border border-input bg-secondary/30"
                  />
                </div>
              </div>
            </div>

            {/* Allocation Details */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Allocation Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Allocation Date
                  </label>
                  <Input
                    name="allocationDate"
                    type="date"
                    value={formData.allocationDate}
                    onChange={handleChange}
                    className="border border-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Check-in Date
                  </label>
                  <Input
                    name="checkInDate"
                    type="date"
                    value={formData.checkInDate}
                    onChange={handleChange}
                    className="border border-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Priority Level
                  </label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      handleSelectChange("priority", value)
                    }
                  >
                    <SelectTrigger className="border border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Allocation Reason
                  </label>
                  <Select
                    value={formData.allocationReason}
                    onValueChange={(value) =>
                      handleSelectChange("allocationReason", value)
                    }
                  >
                    <SelectTrigger className="border border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">
                        Regular Allocation
                      </SelectItem>
                      <SelectItem value="transfer">Transfer Request</SelectItem>
                      <SelectItem value="upgrade">Room Upgrade</SelectItem>
                      <SelectItem value="medical">Medical Reason</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Allocation Notes
                  </label>
                  <Textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Add any special notes or instructions for this allocation"
                    className="border border-input"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 justify-end pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/allocations")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="gap-2 bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                <Save className="w-4 h-4" />
                {isLoading ? "Saving..." : "Update Allocation"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default EditAllocation;
