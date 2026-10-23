import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getRooms, getBlocks, deleteRoom } from "@/lib/supabase-db";
import { supabase } from "@/lib/supabase";

const Rooms = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterBlock, setFilterBlock] = useState("all");
  const [rooms, setRooms] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [blocksRes, roomsRes] = await Promise.all([
          getBlocks(),
          getRooms(),
        ]);

        if (blocksRes.error) {
          toast({
            title: "Error",
            description: "Failed to load blocks",
            variant: "destructive",
          });
        } else {
          setBlocks((blocksRes.data || []).map((b: any) => b.name));
        }

        if (roomsRes.error) {
          toast({
            title: "Error",
            description: "Failed to load rooms",
            variant: "destructive",
          });
        } else {
          const formattedRooms = await Promise.all(
            (roomsRes.data || []).map(async (room: any) => {
              const { count } = await supabase
                .from("allocations")
                .select("*", { count: "exact", head: true })
                .eq("room_id", room.id)
                .eq("status", "approved");

              const occupiedCount = count || 0;
              const capacityNum = room.capacity || 0;
              let status = "free";
              if (occupiedCount >= capacityNum) {
                status = "filled";
              } else if (occupiedCount > 0) {
                status = "pending";
              }

              return {
                id: room.id,
                number: room.room_number,
                block: room.blocks?.name || "Unknown",
                capacity: room.capacity?.toString() || "0",
                occupied: occupiedCount.toString(),
                status,
                dbId: room.id,
              };
            }),
          );
          setRooms(formattedRooms);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "filled":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "free":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredRooms = rooms.filter((room) => {
    const matchSearch = room.number
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchBlock = filterBlock === "all" || room.block === filterBlock;
    return matchSearch && matchBlock;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Rooms</h2>
            <p className="text-muted-foreground mt-1">
              Manage all hostel rooms and their allocations
            </p>
          </div>
          <Button
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={() => navigate("/admin/rooms/add")}
          >
            <Plus className="w-4 h-4" />
            Add Room
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 border border-border">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by room number or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
            >
              {blocks.map((block) => (
                <option key={block} value={block}>
                  {block === "all" ? "All Blocks" : block}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Loading rooms...</p>
            </div>
          ) : filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <Card
                key={room.id}
                className="border border-border p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {room.number}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {room.block}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => navigate(`/admin/rooms/edit/${room.id}`)}
                    title="More options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Status Badge */}
                  <div>
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(
                        room.status,
                      )}`}
                    >
                      {room.status === "filled"
                        ? "🔴 Filled"
                        : room.status === "pending"
                          ? "🟡 Pending"
                          : "🟢 Free"}
                    </span>
                  </div>

                  {/* Room Details */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Capacity
                      </span>
                      <span className="font-semibold text-foreground">
                        {room.capacity} beds
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Occupied
                      </span>
                      <span className="font-semibold text-foreground">
                        {room.occupied}/{room.capacity}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        parseFloat(room.occupied) /
                          parseFloat(room.capacity) ===
                        1
                          ? "bg-red-500"
                          : parseFloat(room.occupied) /
                                parseFloat(room.capacity) >
                              0.5
                            ? "bg-amber-500"
                            : "bg-green-500"
                      }`}
                      style={{
                        width: `${
                          (parseFloat(room.occupied) /
                            parseFloat(room.capacity)) *
                          100
                        }%`,
                      }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => navigate(`/admin/rooms/edit/${room.id}`)}
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 text-red-600 hover:bg-red-100/30"
                      onClick={async () => {
                        if (
                          confirm(
                            `Are you sure you want to delete room ${room.number}?`,
                          )
                        ) {
                          const { error } = await deleteRoom(room.dbId);
                          if (error) {
                            toast({
                              title: "Error",
                              description: "Failed to delete room",
                              variant: "destructive",
                            });
                          } else {
                            toast({
                              title: "Success",
                              description: `Room ${room.number} has been deleted`,
                            });
                            setRooms(rooms.filter((r) => r.dbId !== room.dbId));
                          }
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No rooms found</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Rooms;
