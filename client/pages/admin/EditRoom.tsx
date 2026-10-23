import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getRoom, updateRoom, deleteRoom, getBlocks } from "@/lib/supabase-db";

const EditRoom = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [blocksData, setBlocksData] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    roomNumber: "",
    blockId: "",
    floor: "1",
    capacity: "2",
    roomType: "double",
    roomCategory: "standard",
    amenities: "",
    notes: "",
  });

  useEffect(() => {
    const loadData = async () => {
      if (!roomId) return;
      try {
        setLoadingData(true);
        const [roomRes, blocksRes] = await Promise.all([
          getRoom(roomId),
          getBlocks(),
        ]);

        if (blocksRes.error) {
          toast({
            title: "Error",
            description: "Failed to load blocks",
            variant: "destructive",
          });
        } else {
          setBlocksData(blocksRes.data || []);
        }

        if (roomRes.error) {
          toast({
            title: "Error",
            description: "Failed to load room details",
            variant: "destructive",
          });
          navigate("/admin/rooms");
        } else {
          const room = roomRes.data;
          setFormData({
            roomNumber: room.room_number || "",
            blockId: room.block_id || "",
            floor: (room.floor || 1).toString(),
            capacity: (room.capacity || 2).toString(),
            roomType: room.room_type || "double",
            roomCategory: room.room_category || "standard",
            amenities: room.amenities || "",
            notes: room.notes || "",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [roomId, navigate, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (!roomId) return;
    if (!formData.roomNumber || !formData.blockId || !formData.floor) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await updateRoom(roomId, {
        room_number: formData.roomNumber,
        block_id: formData.blockId,
        floor: parseInt(formData.floor),
        capacity: parseInt(formData.capacity),
        room_type: formData.roomType,
        room_category: formData.roomCategory,
        amenities: formData.amenities || null,
        notes: formData.notes || null,
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update room. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Room ${formData.roomNumber} has been updated successfully`,
        });

        setTimeout(() => {
          navigate("/admin/rooms");
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!roomId) return;
    if (
      !confirm(
        "Are you sure you want to delete this room? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await deleteRoom(roomId);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete room. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Room ${formData.roomNumber} has been deleted`,
        });

        setTimeout(() => {
          navigate("/admin/rooms");
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading room details...</p>
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
            onClick={() => navigate("/admin/rooms")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-foreground">Edit Room</h2>
            <p className="text-muted-foreground mt-1">Update room details</p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-6 border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Room Identification */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Room Identification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Room Number *
                  </label>
                  <Input
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    placeholder="101"
                    className="border border-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Block *
                  </label>
                  <Select
                    value={formData.blockId}
                    onValueChange={(value) =>
                      handleSelectChange("blockId", value)
                    }
                  >
                    <SelectTrigger className="border border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {blocksData.map((block) => (
                        <SelectItem key={block.id} value={block.id}>
                          {block.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Floor *
                  </label>
                  <Select
                    value={formData.floor}
                    onValueChange={(value) =>
                      handleSelectChange("floor", value)
                    }
                  >
                    <SelectTrigger className="border border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((floor) => (
                        <SelectItem key={floor} value={floor.toString()}>
                          Floor {floor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Room Type *
                  </label>
                  <Select
                    value={formData.roomType}
                    onValueChange={(value) =>
                      handleSelectChange("roomType", value)
                    }
                  >
                    <SelectTrigger className="border border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                      <SelectItem value="triple">Triple</SelectItem>
                      <SelectItem value="quad">Quad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Room Details */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Room Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Capacity (Number of Beds) *
                  </label>
                  <Select
                    value={formData.capacity}
                    onValueChange={(value) =>
                      handleSelectChange("capacity", value)
                    }
                  >
                    <SelectTrigger className="border border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((cap) => (
                        <SelectItem key={cap} value={cap.toString()}>
                          {cap} Bed{cap > 1 ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Room Category
                  </label>
                  <Select
                    value={formData.roomCategory}
                    onValueChange={(value) =>
                      handleSelectChange("roomCategory", value)
                    }
                  >
                    <SelectTrigger className="border border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="deluxe">Deluxe</SelectItem>
                      <SelectItem value="economy">Economy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Amenities (e.g., WiFi, AC, Bathroom)
                  </label>
                  <Input
                    name="amenities"
                    value={formData.amenities}
                    onChange={handleChange}
                    placeholder="WiFi, Air Conditioning, Private Bathroom"
                    className="border border-input"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Additional Notes
                  </label>
                  <Input
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any special details about this room"
                    className="border border-input"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 justify-between pt-4 border-t border-border">
              <Button
                type="button"
                variant="destructive"
                className="gap-2"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4" />
                Delete Room
              </Button>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/rooms")}
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
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default EditRoom;
