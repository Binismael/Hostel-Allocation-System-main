import { Check } from "lucide-react";
import {
  BASIC_AMENITIES,
  parseAmenities,
  type RoomCategory,
} from "@/lib/hostel-directory";

interface AmenityListProps {
  category: RoomCategory;
  extraAmenities?: string | null;
}

const AmenityList = ({ category, extraAmenities }: AmenityListProps) => {
  const basic = BASIC_AMENITIES[category];
  const extras = parseAmenities(extraAmenities).filter(
    (a) => !basic.some((b) => b.toLowerCase() === a.toLowerCase()),
  );

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">
        {category === "premium" ? "Premium amenities" : "Basic amenities"}
      </p>
      <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {[...basic, ...extras].map((amenity) => (
          <li
            key={amenity}
            className="flex items-start gap-2 text-sm text-muted-foreground"
          >
            <Check
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary"
              aria-hidden="true"
            />
            {amenity}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AmenityList;
