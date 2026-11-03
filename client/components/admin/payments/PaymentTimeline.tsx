import type { PaymentEvent } from "@/lib/admin-workflow";
import { statusLabel } from "@/components/StatusBadge";

const PaymentTimeline = ({ events }: { events: PaymentEvent[] }) => {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No history yet.</p>;
  }
  return (
    <ol className="space-y-3 border-l-2 border-border pl-4">
      {events.map((event) => (
        <li key={event.id} className="text-sm">
          <p className="font-medium text-foreground">{statusLabel(event.action)}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(event.created_at).toLocaleString()}
          </p>
          {event.notes && <p className="mt-1 text-muted-foreground">{event.notes}</p>}
        </li>
      ))}
    </ol>
  );
};

export default PaymentTimeline;
