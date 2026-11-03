export type RoomCategory = "standard" | "premium";

export interface RoomPhoto {
  label: string;
  src: string;
  alt: string;
}

const pexels = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=640`;

export const BASIC_AMENITIES: Record<RoomCategory, string[]> = {
  standard: [
    "Bunk bed with mattress",
    "Reading table and chair",
    "Wardrobe space",
    "Ceiling fan",
    "Shared toilet and bathroom",
    "Water supply",
    "Electricity",
    "Security",
  ],
  premium: [
    "Bunk bed with mattress",
    "Reading table and chair",
    "Private wardrobe",
    "Ceiling fan",
    "Private toilet and bathroom",
    "Steady water supply",
    "Electricity with backup",
    "24/7 security",
  ],
};

export const ROOM_PHOTOS: Record<RoomCategory, RoomPhoto[]> = {
  standard: [
    {
      label: "Room",
      src: pexels(11295825),
      alt: "Example standard room with a bed and study desk",
    },
    {
      label: "Bunk bed",
      src: pexels(4907197),
      alt: "Example bunk beds in a shared hostel room",
    },
    {
      label: "Toilet",
      src: pexels(13181569),
      alt: "Example shared toilet facility",
    },
  ],
  premium: [
    {
      label: "Room",
      src: pexels(6782479),
      alt: "Example premium room with a bed, desk, and shelves",
    },
    {
      label: "Bunk bed",
      src: pexels(11062931),
      alt: "Example wooden bunk bed in a premium room",
    },
    {
      label: "Toilet",
      src: pexels(8141960),
      alt: "Example private bathroom with toilet and shower",
    },
  ],
};

export function parseAmenities(amenities?: string | null) {
  if (!amenities) return [];
  return amenities
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}
