import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Users, DoorOpen } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getBlocks, deleteBlock } from "@/lib/supabase-db";
import { supabase } from "@/lib/supabase";

const Blocks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBlocks = async () => {
      try {
        setLoading(true);
        const { data, error } = await getBlocks();
        if (error) {
          toast({
            title: "Error",
            description: "Failed to load blocks",
            variant: "destructive",
          });
        } else {
          const enrichedBlocks = await Promise.all(
            (data || []).map(async (block: any) => {
              const { data: roomsData } = await supabase
                .from("rooms")
                .select("id, capacity, room_category")
                .eq("block_id", block.id);

              const roomIds = roomsData?.map((r: any) => r.id) || [];

              let occupiedCount = 0;
              let occupiedRoomsData = [];

              if (roomIds.length > 0) {
                const result = await supabase
                  .from("allocations")
                  .select("room_id", { count: "exact" })
                  .in("room_id", roomIds)
                  .eq("status", "approved");
                occupiedCount = result.count || 0;
                occupiedRoomsData = result.data || [];
              }

              const totalRooms = roomsData?.length || 0;
              const totalCapacity =
                roomsData?.reduce((sum, r) => sum + (r.capacity || 0), 0) || 0;
              const currentOccupancy = occupiedCount || 0;
              const occupiedRooms = new Set(
                occupiedRoomsData?.map((a: any) => a.room_id) || [],
              ).size;

              const roomCategories = Array.from(
                new Set(
                  roomsData
                    ?.filter((r: any) => r.room_category)
                    .map((r: any) => r.room_category) || [],
                ),
              ).sort();

              return {
                id: block.id,
                name: block.name,
                warden: block.warden || "Not assigned",
                totalRooms: totalRooms.toString(),
                occupiedRooms: occupiedRooms.toString(),
                totalCapacity: totalCapacity.toString(),
                currentOccupancy: currentOccupancy.toString(),
                roomCategories,
              };
            }),
          );
          setBlocks(enrichedBlocks);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load blocks",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadBlocks();
  }, [toast]);

  const handleEdit = (blockId: string) => {
    navigate(`/admin/blocks/edit/${blockId}`);
  };

  const handleDelete = async (blockId: string, blockName: string) => {
    if (
      confirm(
        `Are you sure you want to delete "${blockName}"? This will delete all rooms and associated data in this hostel.`,
      )
    ) {
      try {
        // Delete room requests that reference this block
        await supabase
          .from("room_requests")
          .delete()
          .or(
            `preference_1_block_id.eq.${blockId},preference_2_block_id.eq.${blockId},preference_3_block_id.eq.${blockId}`,
          );

        // Get all rooms in this block
        const { data: roomsData } = await supabase
          .from("rooms")
          .select("id")
          .eq("block_id", blockId);

        const roomIds = roomsData?.map((r: any) => r.id) || [];

        // Delete allocations for rooms in this block
        if (roomIds.length > 0) {
          await supabase.from("allocations").delete().in("room_id", roomIds);
        }

        // Delete rooms in this block
        await supabase.from("rooms").delete().eq("block_id", blockId);

        // Delete the block
        const { error } = await deleteBlock(blockId);
        if (error) {
          toast({
            title: "Error",
            description: "Failed to delete hostel. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: `Hostel "${blockName}" has been deleted`,
          });
          setBlocks(blocks.filter((b) => b.id !== blockId));
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to delete hostel. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleViewDetails = (blockId: string) => {
    navigate(`/admin/blocks/view/${blockId}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Hostel Blocks
            </h2>
            <p className="text-muted-foreground mt-1">
              Manage all hostel blocks and their wardens
            </p>
          </div>
          <Button
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={() => navigate("/admin/blocks/add")}
          >
            <Plus className="w-4 h-4" />
            Add Hostel
          </Button>
        </div>

        {/* Blocks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Loading hostels...</p>
            </div>
          ) : (
            blocks.map((block) => (
              <Card key={block.id} className="border border-border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {block.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Warden: {block.warden}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-secondary"
                      onClick={() => handleEdit(block.id)}
                      title="Edit hostel"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-red-100/30 text-red-600"
                      onClick={() => handleDelete(block.id, block.name)}
                      title="Delete hostel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Room Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DoorOpen className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted-foreground">
                          Total Rooms
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {block.totalRooms}
                      </p>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-xs text-muted-foreground">
                          Occupied
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {block.occupiedRooms}
                      </p>
                    </div>
                  </div>

                  {/* Occupancy */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">
                        Capacity
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {block.currentOccupancy}/{block.totalCapacity} students
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{
                          width: `${
                            (parseInt(block.currentOccupancy) /
                              parseInt(block.totalCapacity)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Room Categories */}
                  {block.roomCategories && block.roomCategories.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-2">
                        Room Categories
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {block.roomCategories.map((category: string) => (
                          <div
                            key={category}
                            className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize"
                          >
                            {category}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View Details Button */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleViewDetails(block.id)}
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Blocks;
