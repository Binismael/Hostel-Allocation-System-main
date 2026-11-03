import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import StudentLayout from "@/components/layouts/StudentLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { listNotifications, markRead, type Notification } from "@/lib/notifications";

const TONE: Record<string, string> = {
  allocation_approved: "border-l-green-500",
  payment_verified: "border-l-green-500",
  allocation_waitlisted: "border-l-blue-500",
  payment_rejected: "border-l-red-500",
  allocation_rejected: "border-l-red-500",
};

const Notifications = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await listNotifications(user.id);
    setItems(data);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const read = async (ids?: string[]) => {
    if (!user?.id) return;
    await markRead(user.id, ids);
    setItems((prev) => prev.map((n) => (!ids || ids.includes(n.id) ? { ...n, is_read: true } : n)));
  };

  const unread = items.filter((n) => !n.is_read).length;

  return (
    <StudentLayout>
      <div className="max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Notifications</h2>
            <p className="mt-1 text-muted-foreground">
              Updates about your payments and hostel allocation.
            </p>
          </div>
          {unread > 0 && (
            <Button variant="outline" className="gap-2" onClick={() => read()}>
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading notifications…</p>
        ) : items.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 border border-border p-10 text-center">
            <Bell className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">No notifications yet.</p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {items.map((n) => (
              <li key={n.id}>
                <Card
                  className={`border-l-4 p-4 ${TONE[n.type] ?? "border-l-primary"} ${
                    n.is_read ? "opacity-70" : "bg-primary/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-foreground">{n.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!n.is_read && (
                      <Button size="sm" variant="ghost" onClick={() => read([n.id])}>
                        Mark read
                      </Button>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </StudentLayout>
  );
};

export default Notifications;
