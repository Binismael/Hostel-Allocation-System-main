import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import StudentLayout from "@/components/layouts/StudentLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  getBlocks,
  getStudent,
  getStudentByEmail,
  createStudent,
  createAllocation,
  createNotification,
} from "@/lib/supabase-db";
import { supabase } from "@/lib/supabase";

const RoomRequest = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [preferences, setPreferences] = useState<string[]>([""]);
  const [submitted, setSubmitted] = useState(false);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [studentData, setStudentData] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [semester, setSemester] = useState("1");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [roomPreferences, setRoomPreferences] = useState({
    roomType: "single",
    capacity: "2",
    roomCategory: "standard",
    amenities: "",
    notes: "",
  });
  const [allocationReason, setAllocationReason] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        if (user?.id && user?.email) {
          let student =
            (await getStudentByEmail(user.email))?.data ||
            (await getStudent(user.id))?.data;

          if (!student) {
            const nameParts = user.email.split("@")[0].split(".");
            const firstName = nameParts[0] || "Student";
            const lastName = nameParts[1] || "";

            student = (
              await createStudent({
                id: user.id,
                name: `${firstName} ${lastName}`.trim(),
                email: user.email,
                student_id: `STU-${user.id.substring(0, 8).toUpperCase()}`,
                phone: "",
              })
            )?.data;
          }

          setStudentData(student);
        }

        const { data: blocksData } = await getBlocks();
        setBlocks(blocksData || []);
      } catch (err: any) {
        console.error(err);
        const errorMsg =
          (err instanceof Error ? err.message : null) ||
          err?.message ||
          err?.error?.message ||
          "Failed to load data. Please refresh.";
        setFormError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user?.id) loadData();
  }, [user?.id, user?.email, authLoading]);

  useEffect(() => {
    const autoSelectBlockByCategory = async () => {
      try {
        const { data: roomsData } = await supabase
          .from("rooms")
          .select("block_id, room_category");

        if (!roomsData || roomsData.length === 0) return;

        const blockWithCategory = roomsData.find(
          (room: any) => room.room_category === roomPreferences.roomCategory,
        );

        if (blockWithCategory) {
          const newPrefs = [...preferences];
          newPrefs[0] = blockWithCategory.block_id;
          setPreferences(newPrefs);
        }
      } catch (err) {
        console.error("Error auto-selecting block:", err);
      }
    };

    autoSelectBlockByCategory();
  }, [roomPreferences.roomCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!studentData || !preferences[0] || !phone.trim()) {
      const msg = "Please complete all required fields";
      setFormError(msg);
      toast({
        title: "Validation Error",
        description: msg,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        student_id: studentData.id,
        phone: phone.trim(),
        semester,
        comments: comments?.trim() || null,
        allocation_reason: allocationReason?.trim() || null,

        preference_1_block_id: preferences[0] || null,
        preference_2_block_id: preferences[1] || null,
        preference_3_block_id: preferences[2] || null,

        room_type_preference: roomPreferences.roomType,
        room_capacity_preference: roomPreferences.capacity,
        room_category_preference: roomPreferences.roomCategory,

        status: "pending",
        submitted_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("room_requests").insert([payload]);

      if (error) throw error;

      await createAllocation({
        allocation_id: crypto.randomUUID(),
        student_id: studentData.id,
        status: "pending",
        request_date: new Date().toISOString(),
      });

      await createNotification({
        type: "room_request",
        title: "New Room Request",
        message: `${studentData.name} submitted a room request`,
        student_id: studentData.id,
        is_read: false,
        created_at: new Date().toISOString(),
      });

      toast({
        title: "Success",
        description: "Room request submitted successfully!",
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      const errorMsg =
        (err instanceof Error ? err.message : null) ||
        err?.message ||
        err?.error?.message ||
        "Submission failed";
      setFormError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <p className="text-muted-foreground">Loading room request form…</p>
      </StudentLayout>
    );
  }

  if (submitted) {
    return (
      <StudentLayout>
        <Card className="border border-green-300 bg-green-50 p-8 text-center">
          <h3 className="text-2xl font-bold text-green-900 mb-2">
            Request Submitted Successfully!
          </h3>
          <Button onClick={() => setSubmitted(false)}>Submit Another</Button>
        </Card>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto">
        {formError && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
            {formError}
          </div>
        )}

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Room Request Form</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your phone number"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Semester *</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={String(sem)}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Block Preferences Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Block Preferences</h3>

              {[0, 1, 2].map((index) => (
                <div key={index} className="space-y-2">
                  <label className="text-sm font-medium">
                    Preference {index + 1} {index === 0 ? "*" : ""}
                  </label>
                  <select
                    value={preferences[index] || ""}
                    onChange={(e) => {
                      const newPrefs = [...preferences];
                      newPrefs[index] = e.target.value;
                      setPreferences(newPrefs);
                    }}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    required={index === 0}
                  >
                    <option value="">Select a block</option>
                    {blocks.map((block: any) => (
                      <option key={block.id} value={block.id}>
                        {block.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Room Preferences Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Room Preferences</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Room Type</label>
                  <select
                    value={roomPreferences.roomType}
                    onChange={(e) =>
                      setRoomPreferences({
                        ...roomPreferences,
                        roomType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="triple">Triple</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Capacity</label>
                  <select
                    value={roomPreferences.capacity}
                    onChange={(e) =>
                      setRoomPreferences({
                        ...roomPreferences,
                        capacity: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="1">1 Person</option>
                    <option value="2">2 People</option>
                    <option value="3">3 People</option>
                    <option value="4">4 People</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Room Category</label>
                  <select
                    value={roomPreferences.roomCategory}
                    onChange={(e) =>
                      setRoomPreferences({
                        ...roomPreferences,
                        roomCategory: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="standard">Standard</option>
                    <option value="deluxe">Deluxe</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amenities</label>
                <input
                  type="text"
                  value={roomPreferences.amenities}
                  onChange={(e) =>
                    setRoomPreferences({
                      ...roomPreferences,
                      amenities: e.target.value,
                    })
                  }
                  placeholder="E.g., AC, WiFi, etc."
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Room Notes</label>
                <Textarea
                  value={roomPreferences.notes}
                  onChange={(e) =>
                    setRoomPreferences({
                      ...roomPreferences,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Any additional notes about your room preference"
                />
              </div>
            </div>

            {/* Additional Comments Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium">Allocation Reason</label>
                <Select
                  value={allocationReason}
                  onValueChange={(value) => setAllocationReason(value)}
                >
                  <SelectTrigger className="border border-input">
                    <SelectValue placeholder="Select an allocation reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular Allocation</SelectItem>
                    <SelectItem value="reallocation">Reallocation</SelectItem>
                    <SelectItem value="special">Special Request</SelectItem>
                    <SelectItem value="readmission">Readmission</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Comments</label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Any additional comments or special requests"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 justify-end pt-4 border-t border-border">
              <Button type="button" variant="outline" disabled={submitting}>
                Clear
              </Button>
              <Button
                type="submit"
                className="gap-2 bg-primary hover:bg-primary/90"
                disabled={submitting}
              >
                <Send className="w-4 h-4" />
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </StudentLayout>
  );
};

export default RoomRequest;
