import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import StudentLayout from "@/components/layouts/StudentLayout";
import { Card } from "@/components/ui/card";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { getStudentByEmail } from "@/lib/supabase-db";

const AllocationStatus = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [allocation, setAllocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAllocation = async () => {
      try {
        setLoading(true);

        if (!user?.email) {
          setAllocation(null);
          return;
        }

        // Get student record
        const { data: student } = await getStudentByEmail(user.email);

        if (!student) {
          setAllocation(null);
          return;
        }

        // Get latest allocation
        const { data, error } = await supabase
          .from("allocations")
          .select("*, rooms(room_number, capacity, blocks(name))")
          .eq("student_id", student.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !data) {
          setAllocation(null);
          return;
        }

        // Resolve roommates (if room assigned)
        let roommateNames = "Not assigned yet";

        if (data.room_id) {
          const { data: roommates, error: roommateError } = await supabase
            .from("allocations")
            .select("student_id, students(name)")
            .eq("room_id", data.room_id)
            .neq("student_id", student.id);

          if (roommateError) {
            console.error("Error fetching roommates:", roommateError);
          } else if (roommates && roommates.length > 0) {
            const names = roommates
              .map((r: any) => r.students?.name)
              .filter(Boolean);

            if (names.length > 0) {
              roommateNames = names.join(", ");
            }
          }
        }

        setAllocation({
          id: data.id,
          status: data.status,
          studentName: student.name || "Unknown",
          studentId: student.student_id || "N/A",
          room: data.rooms?.room_number
            ? `Room ${data.rooms.room_number}`
            : "—",
          block: data.rooms?.blocks?.name || "—",
          capacity: data.rooms?.capacity || 0,
          requestDate: new Date(data.created_at).toLocaleDateString(),
          allocatedDate: data.allocated_date
            ? new Date(data.allocated_date).toLocaleDateString()
            : null,
          checkinDate: data.checkin_date
            ? new Date(data.checkin_date).toLocaleDateString()
            : null,
          roommate: roommateNames,
        });
      } catch (err) {
        console.error("Failed to load allocation:", err);
        setAllocation(null);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) loadAllocation();
  }, [user?.email, authLoading, toast]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case "pending":
        return <Clock className="w-12 h-12 text-amber-500" />;
      case "rejected":
        return <AlertCircle className="w-12 h-12 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <p className="text-muted-foreground">Loading allocation status...</p>
      </StudentLayout>
    );
  }

  if (!allocation) {
    return (
      <StudentLayout>
        <Card className="border border-amber-300 bg-amber-50 p-6">
          <div className="flex gap-3">
            <AlertCircle className="text-amber-600" />
            <p className="text-amber-800">
              You have not been allocated a room yet.
            </p>
          </div>
        </Card>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Status Header Card */}
        <Card className="p-8 border-l-4 border-l-green-500">
          <div className="flex gap-6 items-start">
            {getStatusIcon(allocation.status)}
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">
                {allocation.status === "approved"
                  ? "Allocation Approved"
                  : allocation.status === "pending"
                    ? "Pending Review"
                    : "Allocation Rejected"}
              </h2>
              <span
                className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  allocation.status,
                )}`}
              >
                {allocation.status.charAt(0).toUpperCase() +
                  allocation.status.slice(1)}
              </span>
            </div>
          </div>
        </Card>

        {/* Student Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Student Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Student Name</p>
              <p className="text-base font-medium">{allocation.studentName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Student ID</p>
              <p className="text-base font-medium">{allocation.studentId}</p>
            </div>
          </div>
        </Card>

        {/* Allocation Details */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Allocation Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Request Submitted Date
              </p>
              <p className="text-base font-medium">{allocation.requestDate}</p>
            </div>
            {allocation.allocatedDate && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Allocation Date
                </p>
                <p className="text-base font-medium">
                  {allocation.allocatedDate}
                </p>
              </div>
            )}
            {allocation.checkinDate && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Check-in Date
                </p>
                <p className="text-base font-medium">
                  {allocation.checkinDate}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Room Assignment */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Room Assignment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Block</p>
              <p className="text-base font-medium">{allocation.block}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Room</p>
              <p className="text-base font-medium">{allocation.room}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Capacity</p>
              <p className="text-base font-medium">
                {allocation.capacity} Bed(s)
              </p>
            </div>
          </div>
        </Card>

        {/* Roommates */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Room Mates</h3>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Names</p>
            <p className="text-base font-medium">{allocation.roommate}</p>
          </div>
        </Card>

        {/* Status-specific Information */}
        {allocation.status === "pending" && (
          <Card className="p-6 border-l-4 border-l-amber-500 bg-amber-50/30">
            <h3 className="text-lg font-semibold mb-2 text-amber-900">
              Under Review
            </h3>
            <p className="text-sm text-amber-800">
              Your room allocation request is currently being reviewed by the
              administration. You will be notified once a decision has been
              made.
            </p>
          </Card>
        )}

        {allocation.status === "rejected" && (
          <Card className="p-6 border-l-4 border-l-red-500 bg-red-50/30">
            <h3 className="text-lg font-semibold mb-2 text-red-900">
              Not Approved
            </h3>
            <p className="text-sm text-red-800">
              Unfortunately, your room allocation request could not be approved
              at this time. Please contact the administration office for more
              information.
            </p>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
};

export default AllocationStatus;
