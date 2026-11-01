import { Link } from "react-router-dom";
import { Building2, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RoomCategory } from "@/lib/hostel-directory";
import AmenityList from "./AmenityList";
import RoomPreviewCard from "./RoomPreviewCard";

interface HostelCategoryCardProps {
  blockName: string;
  category: RoomCategory;
  rooms: any[];
  preference: string | null;
  isAllocated: boolean;
}

const HostelCategoryCard = ({
  blockName,
  category,
  rooms,
  preference,
  isAllocated,
}: HostelCategoryCardProps) => {
  const totalCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const Icon = category === "premium" ? Star : Building2;
  const extraAmenities = rooms.map((r) => r.amenities).filter(Boolean).join(",");

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

      <div className="mb-4 flex items-start gap-3">
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

      <dl className="my-4 grid grid-cols-2 gap-4 border-y border-gray-200 py-4">
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
      </dl>

      <AmenityList category={category} extraAmenities={extraAmenities} />

      <div className="mt-6 space-y-3">
        <p className="text-sm font-medium text-foreground">Rooms</p>
        <p className="text-xs text-muted-foreground">
          Photos show the typical room, bunk bed, and toilet for this category.
        </p>
        {rooms.map((room) => (
          <RoomPreviewCard key={room.id} room={room} category={category} />
        ))}
      </div>

      {isAllocated && (
        <Button asChild className="mt-4 w-full bg-green-600 hover:bg-green-700">
          <Link to="/student/allocation-status">View your allocation</Link>
        </Button>
      )}
    </Card>
  );
};

export default HostelCategoryCard;
