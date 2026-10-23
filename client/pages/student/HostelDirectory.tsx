import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import StudentLayout from "@/components/layouts/StudentLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Wifi,
  Wind,
  Bath,
  Star,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import {
  getBlocks,
  getStudentByEmail,
  getAllocations,
} from "@/lib/supabase-db";

const HostelDirectory = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [studentData, setStudentData] = useState<any>(null);
  const [userAllocations, setUserAllocations] = useState<any[]>([]);
  const [userPreferences, setUserPreferences] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Get blocks
        const { data: blocksData, error: blocksError } = await getBlocks();
        if (blocksError) {
          console.error("Blocks error:", blocksError);
          setBlocks([]);
        } else {
          setBlocks(blocksData || []);
        }

        // Get rooms with block info
        const { data: roomsData, error: roomsError } = await supabase
          .from("rooms")
          .select("*, blocks(name, id)");

        if (roomsError) {
          console.error("Rooms error:", roomsError);
          setRooms([]);
        } else {
          setRooms(roomsData || []);
        }

        // Get current user's student data
        if (user?.email) {
          const { data: student } = await getStudentByEmail(user.email);
          if (student) {
            setStudentData(student);

            // Get user's allocations
            const { data: allocData } = await supabase
              .from("allocations")
              .select("*")
              .eq("student_id", student.id);

            if (allocData) {
              setUserAllocations(allocData);
            }
          }

          // Get user's room request preferences
          const { data: prefData } = await supabase
            .from("room_requests")
            .select("*")
            .eq("student_id", user.id)
            .order("submitted_at", { ascending: false })
            .limit(1);

          if (prefData && prefData.length > 0) {
            setUserPreferences(prefData[0]);
          }
        }
      } catch (error) {
        console.error("Error loading hostel data:", error);
        toast({
          title: "Error",
          description: "Failed to load hostel directory",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user?.email) {
      loadData();
    }
  }, [user?.email, authLoading, toast]);

  const getBlockStats = (blockId: string, category: string) => {
    const blockRooms = rooms.filter(
      (r) => r.block_id === blockId && r.room_category === category,
    );
    const totalCapacity = blockRooms.reduce(
      (sum, r) => sum + (r.capacity || 0),
      0,
    );
    const totalRooms = blockRooms.length;

    return { totalRooms, totalCapacity, roomList: blockRooms };
  };

  const getStudentPreference = (blockId: string) => {
    if (!userPreferences) return null;

    if (userPreferences.preference_1_block_id === blockId) return "1st Choice";
    if (userPreferences.preference_2_block_id === blockId) return "2nd Choice";
    if (userPreferences.preference_3_block_id === blockId) return "3rd Choice";
    return null;
  };

  const getStudentAllocation = (blockId: string) => {
    return userAllocations.find((alloc) => alloc.block_id === blockId);
  };

  const renderAmenities = (amenities: string) => {
    if (!amenities) return null;

    const amenityList = amenities.split(",").map((a) => a.trim().toLowerCase());

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {amenityList.includes("wifi") && (
          <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            <Wifi className="w-3 h-3" />
            WiFi
          </div>
        )}
        {amenityList.includes("air conditioning") && (
          <div className="flex items-center gap-1 text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded">
            <Wind className="w-3 h-3" />
            A/C
          </div>
        )}
        {amenityList.includes("bathroom") && (
          <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            <Bath className="w-3 h-3" />
            Private Bath
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Hostel Directory
            </h2>
            <p className="text-muted-foreground mt-1">
              Loading hostel information...
            </p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            Hostel Directory
          </h2>
          <p className="text-muted-foreground mt-1">
            Browse available hostel buildings and room options
          </p>
        </div>

        {/* Student Info Banner */}
        {studentData && (
          <Card className="border border-blue-300 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">{studentData.name}</span> (
                  {studentData.student_id}) - Semester {studentData.semester}
                </p>
                {userAllocations.length > 0 && (
                  <p className="text-xs text-blue-800 mt-1">
                    ✓ You have been allocated to a room. Check Allocation Status
                    for details.
                  </p>
                )}
                {userPreferences && !userAllocations.length && (
                  <p className="text-xs text-blue-800 mt-1">
                    ⏳ Your room request is pending review.
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Standard Rooms Section */}
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            Standard Rooms
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blocks.map((block) => {
              const stats = getBlockStats(block.id, "standard");
              const preference = getStudentPreference(block.id);
              const allocation = getStudentAllocation(block.id);

              if (stats.totalRooms === 0) return null;

              return (
                <Card
                  key={`${block.id}-standard`}
                  className={`border-2 p-6 relative overflow-hidden transition-all ${
                    allocation
                      ? "border-green-500 bg-green-50"
                      : preference
                        ? "border-amber-500 bg-amber-50"
                        : "border-border"
                  }`}
                >
                  {allocation && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      ✓ Allocated
                    </div>
                  )}
                  {preference && !allocation && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                      ★ {preference}
                    </div>
                  )}

                  <div className="flex items-start gap-3 mb-4">
                    <Building2 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-foreground">
                        {block.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Standard Category
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-200 my-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Available Rooms
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.totalRooms}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total Capacity
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.totalCapacity}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium text-foreground">
                      Room Features:
                    </p>
                    {stats.roomList[0]?.amenities &&
                      renderAmenities(stats.roomList[0].amenities)}
                    {!stats.roomList[0]?.amenities && (
                      <p className="text-xs text-muted-foreground">
                        Basic amenities included
                      </p>
                    )}
                  </div>

                  {allocation && (
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      View Your Allocation
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>

          {blocks.every(
            (b) => getBlockStats(b.id, "standard").totalRooms === 0,
          ) && (
            <Card className="border border-gray-200 p-6 text-center">
              <p className="text-muted-foreground">
                No standard rooms currently available
              </p>
            </Card>
          )}
        </div>

        {/* Premium Rooms Section */}
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500" />
            Premium Rooms
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blocks.map((block) => {
              const stats = getBlockStats(block.id, "premium");
              const preference = getStudentPreference(block.id);
              const allocation = getStudentAllocation(block.id);

              if (stats.totalRooms === 0) return null;

              return (
                <Card
                  key={`${block.id}-premium`}
                  className={`border-2 p-6 relative overflow-hidden transition-all ${
                    allocation
                      ? "border-green-500 bg-green-50"
                      : preference
                        ? "border-amber-500 bg-amber-50"
                        : "border-border"
                  }`}
                >
                  {allocation && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      ✓ Allocated
                    </div>
                  )}
                  {preference && !allocation && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                      ★ {preference}
                    </div>
                  )}

                  <div className="flex items-start gap-3 mb-4">
                    <Star className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-foreground">
                        {block.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Premium Category
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-200 my-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Available Rooms
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.totalRooms}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Total Capacity
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.totalCapacity}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium text-foreground">
                      Premium Amenities:
                    </p>
                    {stats.roomList[0]?.amenities &&
                      renderAmenities(stats.roomList[0].amenities)}
                    {!stats.roomList[0]?.amenities && (
                      <p className="text-xs text-muted-foreground">
                        Premium amenities included
                      </p>
                    )}
                  </div>

                  {allocation && (
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      View Your Allocation
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>

          {blocks.every(
            (b) => getBlockStats(b.id, "premium").totalRooms === 0,
          ) && (
            <Card className="border border-gray-200 p-6 text-center">
              <p className="text-muted-foreground">
                No premium rooms currently available
              </p>
            </Card>
          )}
        </div>

        {/* Legend */}
        <Card className="border border-border p-6 bg-secondary/20">
          <h4 className="font-semibold text-foreground mb-3">Legend</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 mt-1" />
              <div>
                <p className="font-medium text-foreground">Allocated</p>
                <p className="text-xs text-muted-foreground">
                  You have been assigned to this building
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500 mt-1" />
              <div>
                <p className="font-medium text-foreground">Your Preference</p>
                <p className="text-xs text-muted-foreground">
                  You selected this in your room request
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 mt-1" />
              <div>
                <p className="font-medium text-foreground">Available</p>
                <p className="text-xs text-muted-foreground">
                  Rooms are available for request
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </StudentLayout>
  );
};

export default HostelDirectory;
