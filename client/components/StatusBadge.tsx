const STYLES: Record<string, string> = {
  approved: "bg-green-100 text-green-800",
  verified: "bg-green-100 text-green-800",
  allocated: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  submitted: "bg-amber-100 text-amber-800",
  under_review: "bg-blue-100 text-blue-800",
  waitlisted: "bg-blue-100 text-blue-800",
  reviewed: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
};

const LABELS: Record<string, string> = {
  submitted: "Awaiting review",
  under_review: "Under review",
};

export const statusLabel = (status: string) =>
  LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
      STYLES[status] ?? "bg-gray-100 text-gray-800"
    }`}
  >
    {statusLabel(status)}
  </span>
);

export default StatusBadge;
