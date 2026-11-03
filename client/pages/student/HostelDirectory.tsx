import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import StudentLayout from "@/components/layouts/StudentLayout";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { getBlocks, getStudentByEmail } from "@/lib/supabase-db";
import type { RoomCategory } from "@/lib/hostel-directory";
import { findTier, getFeeTiers, type FeeTier } from "@/lib/payments";
import HostelCategoryCard from "@/components/student/HostelCategoryCard";

const CATEGORY_SECTIONS: {
  category: RoomCategory;
  title: string;
  dotClass: string;
}[] = [
  { category: "standard", title: "Standard Rooms", dotClass: "bg-blue-500" },
  { category: "premium", title: "Premium Rooms", dotClass: "bg-amber-500" },
];

const HostelDirectory = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [studentData, setStudentData] = useState<any>(null);
  const [userAllocations, setUserAllocations] = useState<any[]>([]);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [tiers, setTiers] = useState<FeeTier[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const { data: blocksData, error: blocksError } = await getBlocks();
        if (blocksError) console.error("Blocks error:", blocksError);
        setBlocks(blocksData || []);

        const { data: roomsData, error: roomsError } = await supabase
          .from("rooms")
          .select("*, blocks(name, id)")
          .order("room_number");
        if (roomsError) console.error("Rooms error:", roomsError);
        setRooms(roomsData || []);

        const { data: tierData } = await getFeeTiers();
        setTiers(tierData);

        if (user?.email) {
          const { data: student } = await getStudentByEmail(user.email);
          if (student) {
            setStudentData(student);
            const { data: allocData } = await supabase
              .from("allocations")
              .select("*")
              .eq("student_id", student.id);
            if (allocData) setUserAllocations(allocData);
          }

          const { data: prefData } = await supabase
            .from("room_requests")
            .select("*")
            .eq("student_id", user.id)
            .order("submitted_at", { ascending: false })
            .limit(1);
          if (prefData && prefData.length > 0) setUserPreferences(prefData[0]);
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
  }, [user?.email, user?.id, authLoading, toast]);

  const getBlockRooms = (blockId: string, category: RoomCategory) =>
    rooms.filter(
      (r) => r.block_id === blockId && (r.room_category || "standard") === category,
    );

  const getStudentPreference = (blockId: string) => {
    if (!userPreferences) return null;
    if (userPreferences.preference_1_block_id === blockId) return "1st Choice";
    if (userPreferences.preference_2_block_id === blockId) return "2nd Choice";
    if (userPreferences.preference_3_block_id === blockId) return "3rd Choice";
    return null;
  };

  const isAllocatedToBlock = (blockId: string) =>
    userAllocations.some((alloc) => alloc.block_id === blockId);

  return (
    <StudentLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            Hostel Directory
          </h2>
          <p className="text-muted-foreground mt-1">
            {loading
              ? "Loading hostel information..."
              : "Compare amenities and preview each room before you pay"}
          </p>
        </div>

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

        {!loading &&
          CATEGORY_SECTIONS.map(({ category, title, dotClass }) => {
            const cards = blocks
              .map((block) => ({ block, blockRooms: getBlockRooms(block.id, category) }))
              .filter(({ blockRooms }) => blockRooms.length > 0);

            return (
              <section key={category} aria-labelledby={`${category}-heading`}>
                <h3
                  id={`${category}-heading`}
                  className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2"
                >
                  <span className={`w-4 h-4 rounded-full ${dotClass}`} />
                  {title}
                </h3>

                {cards.length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {cards.map(({ block, blockRooms }) => (
                      <HostelCategoryCard
                        key={`${block.id}-${category}`}
                        blockName={block.name}
                        category={category}
                        rooms={blockRooms}
                        preference={getStudentPreference(block.id)}
                        isAllocated={isAllocatedToBlock(block.id)}
                        fee={findTier(tiers, "room_fee", category)?.amount ?? null}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="border border-gray-200 p-6 text-center">
                    <p className="text-muted-foreground">
                      No {category} rooms currently available
                    </p>
                  </Card>
                )}
              </section>
            );
          })}

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
