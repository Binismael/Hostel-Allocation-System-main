import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getBlock, updateBlock } from "@/lib/supabase-db";

const EditBlock = () => {
  const navigate = useNavigate();
  const { blockId } = useParams<{ blockId: string }>();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBlock, setIsLoadingBlock] = useState(true);
  const [formData, setFormData] = useState({
    blockName: "",
    warden: "",
  });

  useEffect(() => {
    const loadBlock = async () => {
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
        setIsLoadingBlock(true);
        const { data, error } = await getBlock(blockId);
        if (error) {
          toast({
            title: "Error",
            description: "Failed to load block details",
            variant: "destructive",
          });
          navigate("/admin/blocks");
        } else if (data) {
          setFormData({
            blockName: data.name || "",
            warden: data.warden || "",
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
        setIsLoadingBlock(false);
      }
    };

    loadBlock();
  }, [blockId, toast, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

    setIsLoading(true);
    try {
      const { error } = await updateBlock(blockId || "", {
        name: formData.blockName.trim(),
        warden: formData.warden.trim() || null,
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update hostel. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Hostel "${formData.blockName}" has been updated successfully`,
        });

        setTimeout(() => {
          navigate("/admin/blocks");
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update hostel. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingBlock) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading hostel details...</p>
        </div>
      </AdminLayout>
    );
  }

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
            <h2 className="text-3xl font-bold text-foreground">Edit Hostel</h2>
            <p className="text-muted-foreground mt-1">
              Update hostel block details
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
                {isLoading ? "Saving..." : "Update Hostel"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default EditBlock;
