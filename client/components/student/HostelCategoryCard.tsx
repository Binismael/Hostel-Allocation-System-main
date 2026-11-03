import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, ChevronDown, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RoomCategory } from "@/lib/hostel-directory";
import { formatNaira } from "@/lib/payments";
import AmenityList from "./AmenityList";
import RoomPreviewCard from "./RoomPreviewCard";

interface HostelCategoryCardProps {
  blockName: string;
  category: RoomCategory;
  rooms: any[];
  preference: string | null;
  isAllocated: boolean;
  fee: number | null;
}

const HostelCategoryCard = ({
  blockName,
  category,
  rooms,
  preference,
  isAllocated,
  fee,
}: HostelCategoryCardProps) => {
  const totalCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const Icon = category === "premium" ? Star : Building2;
  const extraAmenities = rooms.map((r) => r.amenities).filter(Boolean).join(",");
  const [expanded, setExpanded] = useState(false);
  const previewRoom =
    rooms.find((r) => r.status !== "filled" && r.status !== "occupied") ?? rooms[0];
  const detailsId = `hostel-details-${blockName}-${category}`.replace(/\s+/g, "-");

  return (
    <Card
      className={`relative overflow-hidden border-2 p-6 ${
        isAllocated
          ? "border-green-500 bg-green-50"
          : preference
            ? "border-amber-500 bg-amber-50"
            : "border-border"
      }`}
    >
      {isAllocated ? (
        <span className="absolute right-2 top-2 rounded-full bg-green-500 px-2 py-1 text-xs text-white">
          ✓ Allocated
        </span>
      ) : preference ? (
        <span className="absolute right-2 top-2 rounded-full bg-amber-500 px-2 py-1 text-xs text-white">
          ★ {preference}
        </span>
      ) : null}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={detailsId}
        className="block w-full rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
      <div className="mb-4 flex items-start gap-3 pr-20">
        <Icon
          className={`mt-0.5 h-6 w-6 flex-shrink-0 ${category === "premium" ? "text-amber-600" : "text-blue-600"}`}
          aria-hidden="true"
        />
        <div>
          <h4 className="text-lg font-semibold text-foreground">{blockName}</h4>
          <p className="text-xs capitalize text-muted-foreground">
            {category} category
          </p>
        </div>
      </div>

      <dl className="my-4 grid grid-cols-3 gap-4 border-y border-gray-200 py-4">
        <div>
          <dt className="text-xs text-muted-foreground">Rooms</dt>
          <dd className="text-2xl font-bold text-foreground">{rooms.length}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Total capacity</dt>
          <dd className="text-2xl font-bold text-foreground">
            {totalCapacity}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Fee per student</dt>
          <dd className="text-2xl font-bold text-foreground">
            {fee !== null ? formatNaira(fee) : "—"}
          </dd>
        </div>
      </dl>

      <span className="flex items-center justify-center gap-1 text-sm font-medium text-primary">
        {expanded ? "Hide details" : "View amenities & room"}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </span>
      </button>

      {expanded && (
        <div id={detailsId} className="mt-4">
          <AmenityList category={category} extraAmenities={extraAmenities} />

          {previewRoom && (
            <div className="mt-6 space-y-3">
              <p className="text-sm font-medium text-foreground">Room preview</p>
              <p className="text-xs text-muted-foreground">
                Photos show the typical room, bunk bed, and toilet for this category.
              </p>
              <RoomPreviewCard room={previewRoom} category={category} />
            </div>
          )}
        </div>
      )}

      {isAllocated && (
        <Button asChild className="mt-4 w-full bg-green-600 hover:bg-green-700">
          <Link to="/student/allocation-status">View your allocation</Link>
        </Button>
      )}
    </Card>
  );
};

export default HostelCategoryCard;
