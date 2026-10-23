import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2, Trash2, Users, DoorOpen } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getBlock, deleteBlock } from "@/lib/supabase-db";
import { supabase } from "@/lib/supabase";

const ViewBlockDetails = () => {
  const navigate = useNavigate();
  const { blockId } = useParams<{ blockId: string }>();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [block, setBlock] = useState<any>(null);
  const [stats, setStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    totalCapacity: 0,
    currentOccupancy: 0,
  });

  useEffect(() => {
    const loadBlockDetails = async () => {
      if (!blockId) {
        toast({
          title: "Error",
          description: "Block ID is required",
          variant: "destructive",
        });
        navigate("/admin/blocks");
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await getBlock(blockId);
        if (error) {
          toast({
            title: "Error",
            description: "Failed to load block details",
            variant: "destructive",
          });
          navigate("/admin/blocks");
        } else if (data) {
          setBlock(data);

          // Load room statistics
          const { data: roomsData } = await supabase
            .from("rooms")
            .select("id, capacity")
            .eq("block_id", blockId);

          const { count: occupiedCount } = await supabase
            .from("allocations")
            .select("*", { count: "exact", head: true })
            .eq("block_id", blockId)
            .eq("status", "approved");

          const totalRooms = roomsData?.length || 0;
          const totalCapacity =
            roomsData?.reduce((sum, r) => sum + (r.capacity || 0), 0) || 0;
          const currentOccupancy = occupiedCount || 0;

          setStats({
            totalRooms,
            occupiedRooms: Math.min(currentOccupancy, totalRooms),
            totalCapacity,
            currentOccupancy,
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load block details",
          variant: "destructive",
        });
        navigate("/admin/blocks");
      } finally {
        setIsLoading(false);
      }
    };

    loadBlockDetails();
  }, [blockId, toast, navigate]);

  const handleEdit = () => {
    navigate(`/admin/blocks/edit/${blockId}`);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${block?.name}"? This will affect all rooms in this hostel.`,
      )
    ) {
      return;
    }

    try {
      const { error } = await deleteBlock(blockId || "");
      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete hostel",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Hostel "${block?.name}" has been deleted`,
        });
        setTimeout(() => {
          navigate("/admin/blocks");
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete hostel",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading hostel details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!block) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Hostel not found</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
                {block.name}
              </h2>
              <p className="text-muted-foreground mt-1">
                Hostel block details and statistics
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
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Hostel Name</p>
                  <p className="text-lg font-semibold text-foreground">
                    {block.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Warden</p>
                  <p className="text-lg font-semibold text-foreground">
                    {block.warden || "Not assigned"}
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-secondary/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DoorOpen className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      Total Rooms
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalRooms}
                  </p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      Occupied Rooms
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.occupiedRooms}
                  </p>
                </div>
              </div>

              {/* Capacity Progress */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">
                    Capacity Utilization
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {stats.currentOccupancy}/{stats.totalCapacity} students
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{
                      width: `${
                        stats.totalCapacity > 0
                          ? (stats.currentOccupancy / stats.totalCapacity) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={() => navigate("/admin/blocks")}>
            Back to Hostels
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => navigate(`/admin/rooms?blockId=${blockId}`)}
          >
            View Rooms
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ViewBlockDetails;
