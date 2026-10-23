import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { createBlock, createRoom } from "@/lib/supabase-db";
import { supabase } from "@/lib/supabase";

const AddBlock = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    blockName: "",
    warden: "",
  });
  const [rooms, setRooms] = useState<any[]>([
    {
      roomNumber: "",
      floor: "1",
      capacity: "2",
      roomType: "double",
      roomCategory: "standard",
    },
  ]);
  const [generateConfig, setGenerateConfig] = useState({
    startNumber: "101",
    quantity: "25",
    floor: "1",
    capacity: "2",
    roomType: "double",
    roomCategory: "standard",
  });
  const [useManualEntry, setUseManualEntry] = useState(false);

  const getRoomTypeCapacity = (roomType: string): string => {
    const capacityMap: { [key: string]: string } = {
      single: "1",
      double: "2",
      triple: "3",
      quad: "4",
    };
    return capacityMap[roomType.toLowerCase()] || "2";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoomChange = (index: number, field: string, value: string) => {
    const updatedRooms = [...rooms];
    updatedRooms[index][field] = value;

    if (field === "roomType") {
      updatedRooms[index].capacity = getRoomTypeCapacity(value);
    }

    setRooms(updatedRooms);
  };

  const addRoom = () => {
    setRooms([
      ...rooms,
      {
        roomNumber: "",
        floor: "1",
        capacity: "2",
        roomType: "double",
        roomCategory: "standard",
      },
    ]);
  };

  const removeRoom = (index: number) => {
    if (rooms.length > 1) {
      setRooms(rooms.filter((_, i) => i !== index));
    } else {
      toast({
        title: "Validation Error",
        description: "You must have at least one room",
        variant: "destructive",
      });
    }
  };

  const handleGenerateConfigRoomTypeChange = (roomType: string) => {
    const capacity = getRoomTypeCapacity(roomType);
    setGenerateConfig((prev) => ({
      ...prev,
      roomType,
      capacity,
    }));
  };

  const generateRooms = () => {
    const startNum = parseInt(generateConfig.startNumber);
    const quantity = parseInt(generateConfig.quantity);

    if (isNaN(startNum) || isNaN(quantity) || quantity < 1 || quantity > 100) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid quantity (1-100)",
        variant: "destructive",
      });
      return;
    }

    const capacity = getRoomTypeCapacity(generateConfig.roomType);
    const generatedRooms = [];
    for (let i = 0; i < quantity; i++) {
      generatedRooms.push({
        roomNumber: (startNum + i).toString(),
        floor: generateConfig.floor,
        capacity,
        roomType: generateConfig.roomType,
        roomCategory: generateConfig.roomCategory,
      });
    }

    setRooms(generatedRooms);
    setUseManualEntry(false);
    toast({
      title: "Success",
      description: `Generated ${quantity} rooms`,
    });
  };

  const switchToManualEntry = () => {
    setRooms([
      {
        roomNumber: "",
        floor: "1",
        capacity: "2",
        roomType: "double",
        roomCategory: "standard",
      },
    ]);
    setUseManualEntry(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.blockName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a hostel name",
        variant: "destructive",
      });
      return;
    }

    const validRooms = rooms.filter((r) => r.roomNumber.trim());
    if (validRooms.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one room with a room number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const blockId = crypto.randomUUID();
      const { error: blockError } = await createBlock({
        id: blockId,
        block_id: blockId,
        name: formData.blockName.trim(),
        warden: formData.warden.trim() || null,
      });

      if (blockError) {
        toast({
          title: "Error",
          description: "Failed to add hostel. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Batch create all rooms for this block
      const roomsToInsert = validRooms.map((room) => ({
        room_id: `ROOM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        room_number: room.roomNumber.trim(),
        block_id: blockId,
        floor: parseInt(room.floor),
        capacity: parseInt(room.capacity),
        room_type: room.roomType,
        room_category: room.roomCategory,
        status: "free",
      }));

      const { error: roomError } = await supabase
        .from("rooms")
        .insert(roomsToInsert);

      if (roomError) {
        const errorMsg = roomError?.message || "Failed to create rooms";
        console.error("Error creating rooms:", errorMsg);
        toast({
          title: "Error",
          description: `Failed to create rooms: ${errorMsg}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Hostel "${formData.blockName}" with ${validRooms.length} room(s) has been added successfully`,
      });

      setTimeout(() => {
        navigate("/admin/blocks");
      }, 1500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add hostel. Please try again.",
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
            onClick={() => navigate("/admin/blocks")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Add New Hostel
            </h2>
            <p className="text-muted-foreground mt-1">
              Create a new hostel block
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-6 border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Hostel Information */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Hostel Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Hostel Name *
                  </label>
                  <Input
                    name="blockName"
                    value={formData.blockName}
                    onChange={handleChange}
                    placeholder="e.g., Block A, North Wing"
                    className="border border-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Warden Name
                  </label>
                  <Input
                    name="warden"
                    value={formData.warden}
                    onChange={handleChange}
                    placeholder="e.g., John Smith"
                    className="border border-input"
                  />
                </div>
              </div>
            </div>

            {/* Bulk Room Generation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Quick Room Generation
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Generate multiple rooms at once. Recommended: 25-30 rooms per
                hostel
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Starting Room Number
                  </label>
                  <Input
                    type="number"
                    value={generateConfig.startNumber}
                    onChange={(e) =>
                      setGenerateConfig({
                        ...generateConfig,
                        startNumber: e.target.value,
                      })
                    }
                    placeholder="e.g., 101"
                    className="border border-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    value={generateConfig.quantity}
                    onChange={(e) =>
                      setGenerateConfig({
                        ...generateConfig,
                        quantity: e.target.value,
                      })
                    }
                    placeholder="e.g., 25"
                    min="1"
                    max="100"
                    className="border border-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Default Floor
                  </label>
                  <select
                    value={generateConfig.floor}
                    onChange={(e) =>
                      setGenerateConfig({
                        ...generateConfig,
                        floor: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((floor) => (
                      <option key={floor} value={floor}>
                        Floor {floor}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Default Capacity
                  </label>
                  <select
                    value={generateConfig.capacity}
                    onChange={(e) =>
                      setGenerateConfig({
                        ...generateConfig,
                        capacity: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {[1, 2, 3, 4, 5, 6].map((cap) => (
                      <option key={cap} value={cap}>
                        {cap} Bed{cap > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Default Room Type
                  </label>
                  <select
                    value={generateConfig.roomType}
                    onChange={(e) =>
                      handleGenerateConfigRoomTypeChange(e.target.value)
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="triple">Triple</option>
                    <option value="quad">Quad</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Default Category
                  </label>
                  <select
                    value={generateConfig.roomCategory}
                    onChange={(e) =>
                      setGenerateConfig({
                        ...generateConfig,
                        roomCategory: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="deluxe">Deluxe</option>
                  </select>
                </div>
              </div>

              <Button
                type="button"
                onClick={generateRooms}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Generate Rooms
              </Button>
            </div>

            {/* Rooms Information */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Rooms ({rooms.filter((r) => r.roomNumber.trim()).length})
                </h3>
                <div className="flex gap-2">
                  {!useManualEntry && rooms.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={switchToManualEntry}
                      className="gap-2"
                    >
                      Manual Entry
                    </Button>
                  )}
                  {useManualEntry && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addRoom}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Room
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {rooms.length > 0 && !useManualEntry && (
                  <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✓ {rooms.length} room(s) have been generated and are ready
                      to be created
                    </p>
                  </div>
                )}
                {rooms.map((room, index) => (
                  <div
                    key={index}
                    className="p-4 border border-border rounded-lg space-y-3"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-medium text-muted-foreground">
                        Room {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeRoom(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Room Number *
                        </label>
                        <Input
                          value={room.roomNumber}
                          onChange={(e) =>
                            handleRoomChange(
                              index,
                              "roomNumber",
                              e.target.value,
                            )
                          }
                          placeholder="e.g., 101, 102"
                          className="border border-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Floor
                        </label>
                        <select
                          value={room.floor}
                          onChange={(e) =>
                            handleRoomChange(index, "floor", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((floor) => (
                            <option key={floor} value={floor}>
                              Floor {floor}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Capacity
                        </label>
                        <select
                          value={room.capacity}
                          onChange={(e) =>
                            handleRoomChange(index, "capacity", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {[1, 2, 3, 4, 5, 6].map((cap) => (
                            <option key={cap} value={cap}>
                              {cap} Bed{cap > 1 ? "s" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Room Type
                        </label>
                        <select
                          value={room.roomType}
                          onChange={(e) =>
                            handleRoomChange(index, "roomType", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="single">Single</option>
                          <option value="double">Double</option>
                          <option value="triple">Triple</option>
                          <option value="quad">Quad</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="space-y-2 md:col-span-4">
                        <label className="text-sm font-medium text-foreground">
                          Room Category
                        </label>
                        <select
                          value={room.roomCategory}
                          onChange={(e) =>
                            handleRoomChange(
                              index,
                              "roomCategory",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="standard">Standard</option>
                          <option value="premium">Premium</option>
                          <option value="deluxe">Deluxe</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 justify-end pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/blocks")}
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
                {isLoading ? "Saving..." : "Add Hostel"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AddBlock;
