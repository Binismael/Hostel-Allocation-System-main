import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Eye } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

interface OccupiedRoom {
  roomId: string;
  roomNumber: string;
  block: string;
  capacity: number;
  students: Array<{
    name: string;
    email: string;
    studentId: string;
  }>;
  occupiedCount: number;
}

const OccupiedRooms = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterBlock, setFilterBlock] = useState("all");
  const [occupiedRooms, setOccupiedRooms] = useState<OccupiedRoom[]>([]);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOccupiedRooms = async () => {
      try {
        setLoading(true);

        // Get all approved allocations with room and student data
        const { data: allocations, error: allocError } = await supabase
          .from("allocations")
          .select(
            `
            id,
            room_id,
            student_id,
            rooms (
              id,
              room_number,
              capacity,
              blocks (name)
            ),
            students (
              id,
              name,
              email,
              student_id
            )
          `,
          )
          .eq("status", "approved");

        if (allocError) {
          toast({
            title: "Error",
            description: "Failed to load occupied rooms",
            variant: "destructive",
          });
          return;
        }

        // Group allocations by room
        const roomMap = new Map<string, OccupiedRoom>();
        const blockSet = new Set<string>();

        allocations?.forEach((alloc: any) => {
          if (!alloc.rooms) return;

          const roomId = alloc.rooms.id;
          const blockName = alloc.rooms.blocks?.name || "Unknown";
          blockSet.add(blockName);

          if (!roomMap.has(roomId)) {
            roomMap.set(roomId, {
              roomId,
              roomNumber: alloc.rooms.room_number,
              block: blockName,
              capacity: alloc.rooms.capacity || 0,
              students: [],
              occupiedCount: 0,
            });
          }

          const room = roomMap.get(roomId)!;
          if (alloc.students) {
            room.students.push({
              name: alloc.students.name,
              email: alloc.students.email,
              studentId: alloc.students.student_id,
            });
            room.occupiedCount = room.students.length;
          }
        });

        setOccupiedRooms(Array.from(roomMap.values()));
        setBlocks(["all", ...Array.from(blockSet).sort()]);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load occupied rooms",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadOccupiedRooms();
  }, [toast]);

  const filteredRooms = occupiedRooms.filter((room) => {
    const matchSearch = room.roomNumber
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
            <h2 className="text-3xl font-bold text-foreground">
              Occupied Rooms
            </h2>
            <p className="text-muted-foreground mt-1">
              View all occupied rooms and their current occupants
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 border border-border">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by room number..."
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
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Loading occupied rooms...</p>
            </div>
          ) : filteredRooms.length > 0 ? (
            filteredRooms.map((room) => (
              <Card
                key={room.roomId}
                className="border border-border p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {room.roomNumber}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {room.block}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Occupancy</p>
                    <p className="text-xl font-bold text-foreground">
                      {room.occupiedCount}/{room.capacity}
                    </p>
                  </div>
                </div>

                {/* Occupancy Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{
                        width: `${(room.occupiedCount / room.capacity) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Students List */}
                <div className="space-y-3 mb-4">
                  <h4 className="font-semibold text-foreground text-sm">
                    Assigned Students
                  </h4>
                  {room.students.length > 0 ? (
                    <div className="space-y-2">
                      {room.students.map((student, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-secondary/30 rounded-lg border border-border"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-foreground">
                                {student.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {student.studentId}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {student.email}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-secondary"
                              onClick={() => {
                                // Could navigate to student details page if needed
                              }}
                              title="View student details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No students assigned
                    </p>
                  )}
                </div>

                {/* Empty Beds Info */}
                {room.occupiedCount < room.capacity && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800">
                      {room.capacity - room.occupiedCount} bed(s) available
                    </p>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No occupied rooms found</p>
            </div>
          )}
        </div>

        {/* Summary Statistics */}
        {filteredRooms.length > 0 && (
          <Card className="p-6 border border-border bg-secondary/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Occupied</p>
                <p className="text-3xl font-bold text-foreground">
                  {filteredRooms.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold text-foreground">
                  {filteredRooms.reduce(
                    (sum, room) => sum + room.occupiedCount,
                    0,
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Available</p>
                <p className="text-3xl font-bold text-foreground">
                  {filteredRooms.reduce(
                    (sum, room) => sum + (room.capacity - room.occupiedCount),
                    0,
                  )}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default OccupiedRooms;
