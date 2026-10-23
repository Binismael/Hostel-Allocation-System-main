import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createRoom, getBlocks } from "@/lib/supabase-db";

const AddRoom = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
    const loadBlocks = async () => {
      const { data, error } = await getBlocks();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load blocks",
          variant: "destructive",
        });
      } else {
        setBlocksData(data || []);
        if (data && data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            blockId: data[0].id,
          }));
        }
      }
    };
    loadBlocks();
  }, [toast]);

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
      const roomId = `ROOM-${Date.now()}`;
      const { error } = await createRoom({
        room_id: roomId,
        room_number: formData.roomNumber,
        block_id: formData.blockId,
        floor: parseInt(formData.floor),
        capacity: parseInt(formData.capacity),
        room_type: formData.roomType,
        room_category: formData.roomCategory,
        amenities: formData.amenities || null,
        notes: formData.notes || null,
        status: "free",
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add room. Please try again.",
          variant: "destructive",
        });
      } else {
        const block = blocksData.find((b) => b.id === formData.blockId);
        toast({
          title: "Success",
          description: `Room ${block?.name}-${formData.roomNumber} has been added successfully`,
        });

        setTimeout(() => {
          navigate("/admin/rooms");
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add room. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            <h2 className="text-3xl font-bold text-foreground">Add New Room</h2>
            <p className="text-muted-foreground mt-1">
              Register a new room in the hostel
            </p>
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
            <div className="flex gap-4 justify-end pt-4 border-t border-border">
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
                {isLoading ? "Saving..." : "Add Room"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AddRoom;
