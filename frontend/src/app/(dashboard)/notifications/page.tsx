'use client';

import { Bell, Check, CheckCheck, Inbox } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'all'],
    queryFn: () => notificationsApi.list({ limit: 100 }),
    refetchInterval: 60000,
  });

  const refreshNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: refreshNotifications,
  });

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: refreshNotifications,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread_count ?? 0;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-[#e8ecf3] bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="size-5 text-[#0ea5e9]" aria-hidden="true" />
            <h1 className="text-balance font-display text-2xl font-extrabold text-[#003a5e]">Notifications</h1>
          </div>
          <p className="mt-1 text-pretty text-sm text-[#1e2c3a]/65">
            Agreement updates, consent requests, and return reminders.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-[#0068a3] transition-colors duration-200 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
          >
            <CheckCheck className="size-4" aria-hidden="true" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-[#e8ecf3] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e8ecf3] px-6 py-4">
          <h2 className="font-display text-base font-bold text-[#003a5e]">All notifications</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium tabular-nums text-slate-600">
            {unreadCount} unread
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-0 divide-y divide-[#e8ecf3] p-6">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                <div className="size-9 shrink-0 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-4/5 rounded bg-slate-200" />
                  <div className="h-3 w-28 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-[#003a5e]">
              <Inbox className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-3 text-base font-semibold text-[#003a5e]">No notifications yet</h3>
            <p className="mt-1 max-w-sm text-pretty text-sm leading-5 text-[#1e2c3a]/60">
              New agreement activity and reminders will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#e8ecf3]">
            {notifications.map((notification) => (
              <li key={notification.id} className={`flex items-start gap-3 px-6 py-4 ${notification.is_read ? '' : 'bg-sky-50/60'}`}>
                <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${notification.is_read ? 'bg-slate-100 text-slate-500' : 'bg-sky-100 text-[#0068a3]'}`}>
                  {notification.is_read ? <Check className="size-4" aria-hidden="true" /> : <Bell className="size-4" aria-hidden="true" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-pretty text-sm leading-5 text-[#003a5e]">{notification.message}</p>
                  <time className="mt-1 block text-xs text-slate-500">{formatNotificationTime(notification.created_at)}</time>
                </div>
                {!notification.is_read && (
                  <button
                    type="button"
                    onClick={() => markRead.mutate(notification.id)}
                    disabled={markRead.isPending}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-[#0068a3] transition-colors duration-200 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0ea5e9]"
                  >
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
