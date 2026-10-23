import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  getStudents,
  getRooms,
  getBlocks,
  createAllocation,
} from "@/lib/supabase-db";
import { supabase } from "@/lib/supabase";

const AddAllocation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [studentPreferences, setStudentPreferences] = useState<any>(null);
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    studentId: "",
    studentName: "",
    roomId: "",
    roomNumber: "",
    block: "",
    blockName: "",
    allocationDate: new Date().toISOString().split("T")[0],
    semester: "",
    priority: "normal",
    allocationReason: "regular",
    notes: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [studentsRes, roomsRes, blocksRes] = await Promise.all([
          getStudents(),
          getRooms(),
          getBlocks(),
        ]);

        if (studentsRes.error) {
          toast({
            title: "Error",
            description: "Failed to load students",
            variant: "destructive",
          });
        } else {
          setStudents(studentsRes.data || []);
        }

        if (roomsRes.error) {
          toast({
            title: "Error",
            description: "Failed to load rooms",
            variant: "destructive",
          });
        } else {
          const formattedRooms = (roomsRes.data || []).map((room: any) => ({
            id: room.id,
            number: room.room_number,
            block_id: room.block_id,
            capacity: room.capacity,
          }));
          setRooms(formattedRooms);
          setFilteredRooms(formattedRooms);
        }

        if (blocksRes.error) {
          toast({
            title: "Error",
            description: "Failed to load blocks",
            variant: "destructive",
          });
        } else {
          setBlocks(blocksRes.data || []);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [toast]);

  const handleSelectChange = async (name: string, value: string) => {
    if (name === "studentId") {
      const student = students.find((s) => s.id === value);
      setFormData((prev) => ({
        ...prev,
        studentId: value,
        studentName: student?.name || "",
        semester: student?.semester?.toString() || "",
        roomId: "",
        roomNumber: "",
        block: "",
        blockName: "",
      }));

      const { data: preferences } = await supabase
        .from("room_requests")
        .select("preference_1_block_id")
        .eq("student_id", value)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .single();

      if (preferences) {
        setStudentPreferences(preferences);
        const preferredBlockRooms = rooms.filter(
          (r) => r.block_id === preferences.preference_1_block_id,
        );
        setFilteredRooms(preferredBlockRooms);
      } else {
        setStudentPreferences(null);
        setFilteredRooms(rooms);
      }
    } else if (name === "roomId") {
      const availableRooms = studentPreferences ? filteredRooms : rooms;
      const room = availableRooms.find((r) => r.id === value);
      const blockName = blocks.find((b) => b.id === room?.block_id)?.name || "";
      setFormData((prev) => ({
        ...prev,
        roomId: value,
        roomNumber: room?.number || "",
        block: room?.block_id || "",
        blockName: blockName,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.studentId || !formData.roomId) {
      toast({
        title: "Validation Error",
        description: "Please select both student and room",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const hostelPrefix = formData.blockName
        .replace(/\s+/g, "-")
        .toUpperCase()
        .slice(0, 10);
      const uniqueSuffix = Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, "0");
      const allocationId = `${hostelPrefix}-${uniqueSuffix}`;
      const allocationUUID = crypto.randomUUID();

      const { error } = await createAllocation({
        id: allocationUUID,
        allocation_id: allocationId,
        student_id: formData.studentId,
        room_id: formData.roomId,
        block_id: formData.block,
        request_date: formData.allocationDate,
        allocated_date: formData.allocationDate,
        status: "approved",
        priority: formData.priority,
        reason: formData.allocationReason,
        notes: formData.notes || null,
        semester: formData.semester,
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create allocation. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Allocation ${allocationId} created for ${formData.studentName} in room ${formData.block}-${formData.roomNumber}`,
        });

        setTimeout(() => {
          navigate("/admin/allocations");
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create allocation. Please try again.",
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
            onClick={() => navigate("/admin/allocations")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              Create New Allocation
            </h2>
            <p className="text-muted-foreground mt-1">
              Allocate a hostel room to a student
            </p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-6 border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Selection */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Student Selection
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Student *
                  </label>
                  <Select
                    value={formData.studentId}
                    onValueChange={(value) =>
                      handleSelectChange("studentId", value)
                    }
                    disabled={loadingData}
                  >
                    <SelectTrigger className="border border-input">
                      <SelectValue
                        placeholder={
                          loadingData ? "Loading..." : "Select a student"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({student.student_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Current Semester
                  </label>
                  <Input
                    type="text"
                    value={
                      formData.semester ? `Semester ${formData.semester}` : ""
                    }
                    disabled
                    className="border border-input bg-secondary/30"
                  />
                </div>
              </div>
            </div>

            {/* Room Selection */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Room Selection
              </h3>
              {formData.studentId && studentPreferences && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                  <p className="font-medium">
                    Showing rooms from student's preferred hostel block
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Room *
                  </label>
                  <Select
                    value={formData.roomId}
                    onValueChange={(value) =>
                      handleSelectChange("roomId", value)
                    }
                    disabled={loadingData || !formData.studentId}
                  >
                    <SelectTrigger className="border border-input">
                      <SelectValue
                        placeholder={
                          !formData.studentId
                            ? "Select a student first"
                            : loadingData
                              ? "Loading..."
                              : "Select a room"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(filteredRooms.length > 0 ? filteredRooms : rooms).map(
                        (room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.block_id}-{room.number} (Capacity:{" "}
                            {room.capacity})
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Block
                  </label>
                  <Input
                    type="text"
                    value={formData.block}
                    disabled
                    className="border border-input bg-secondary/30"
                  />
                </div>
              </div>
            </div>

            {/* Allocation Details */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Allocation Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Allocation Date
                  </label>
                  <Input
                    type="date"
                    name="allocationDate"
                    value={formData.allocationDate}
                    onChange={handleChange}
                    className="border border-input"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Priority Level
                  </label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      handleSelectChange("priority", value)
                    }
                  >
                    <SelectTrigger className="border border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Allocation Reason
                  </label>
                  <Select
                    value={formData.allocationReason}
                    onValueChange={(value) =>
                      handleSelectChange("allocationReason", value)
                    }
                  >
                    <SelectTrigger className="border border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">
                        Regular Allocation
                      </SelectItem>
                      <SelectItem value="reallocation">Reallocation</SelectItem>
                      <SelectItem value="special">Special Request</SelectItem>
                      <SelectItem value="readmission">Readmission</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Allocation Notes
                  </label>
                  <Textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Add any special notes or instructions for this allocation"
                    className="border border-input"
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 justify-end pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/allocations")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="gap-2 bg-primary hover:bg-primary/90"
                disabled={isLoading || loadingData}
              >
                <Save className="w-4 h-4" />
                {isLoading ? "Creating..." : "Create Allocation"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AddAllocation;
