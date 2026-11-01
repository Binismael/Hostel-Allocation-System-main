import { Link } from "react-router-dom";
import { CreditCard, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROOM_PHOTOS, type RoomCategory } from "@/lib/hostel-directory";

interface RoomPreviewCardProps {
  room: {
    id: string;
    room_number: string;
    capacity?: number | null;
    room_type?: string | null;
    status?: string | null;
  };
  category: RoomCategory;
}

const RoomPreviewCard = ({ room, category }: RoomPreviewCardProps) => {
  const photos = ROOM_PHOTOS[category];
  const isFull = room.status === "filled" || room.status === "occupied";

  return (
    <article className="rounded-lg border border-border bg-background p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h5 className="text-sm font-semibold text-foreground">
            Room {room.room_number}
          </h5>
          <p className="flex items-center gap-1 text-xs capitalize text-muted-foreground">
            <Users className="h-3 w-3" aria-hidden="true" />
            {room.capacity ?? "—"} beds
            {room.room_type ? ` · ${room.room_type}` : ""}
          </p>
        </div>
        {isFull ? (
          <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
            Full
          </span>
        ) : (
          <Button asChild size="sm" className="gap-1.5">
            <Link to={`/student/payment?room=${encodeURIComponent(room.id)}`}>
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              Pay now
            </Link>
          </Button>
        )}
      </div>

      <ul className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <li key={photo.label}>
            <figure>
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-md object-cover"
              />
              <figcaption className="mt-1 text-center text-xs text-muted-foreground">
                {photo.label}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </article>
  );
};

export default RoomPreviewCard;
