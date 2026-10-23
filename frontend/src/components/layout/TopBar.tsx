'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Command, Menu, Search, User, LogOut, Settings, CircleUserRound } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { useDashboardModeStore } from '@/stores/dashboard-mode.store';
import { notificationsApi } from '@/lib/api/notifications';

export default function TopBar() {
  const queryClient = useQueryClient();
  const toggleSidebar = useAuthStore((state) => state.toggleSidebar);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { mode, setMode } = useDashboardModeStore();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsApi.list({ limit: 5 }),
    refetchInterval: 60000,
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread_count ?? 0;
  const hasNotifications = notifications.length > 0;
  const refreshNotifications = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });
  const markRead = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: refreshNotifications });
  const markAllRead = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: refreshNotifications });

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
  };

  return (
    <header className="relative z-40 flex h-[68px] shrink-0 items-center justify-between border-b border-[#e8ecf3] bg-white px-4 shadow-sm sm:px-6 md:h-[72px]">
      <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
        <button
          type="button"
          onClick={toggleSidebar}
          className="shrink-0 rounded-xl border border-[#e8ecf3] p-2 text-[#003a5e] transition-colors duration-200 hover:bg-slate-50 lg:hidden cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <Menu className="size-5" />
        </button>
        <div className="relative hidden min-w-0 max-w-sm flex-1 sm:block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search contracts and items"
            className="h-10 w-full rounded-xl border border-[#e8ecf3] bg-white py-2 pl-10 pr-12 text-sm text-[#003a5e] outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-[#0ea5e9] focus:ring-2 focus:ring-sky-100"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
            <Command className="size-3" aria-hidden="true" />K
          </span>
        </div>
      </div>

      <div className="relative ml-3 flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="inline-flex shrink-0 rounded-xl border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode('owner')}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors duration-200 cursor-pointer ${mode === 'owner' ? 'bg-[#003a5e] text-white shadow-sm' : 'text-slate-600 hover:text-[#003a5e]'}`}
          >
            <User className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">As Owner</span>
            <span className="sm:hidden">Owner</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('party')}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors duration-200 cursor-pointer ${mode === 'party' ? 'bg-[#0ea5e9] text-white shadow-sm' : 'text-slate-600 hover:text-[#003a5e]'}`}
          >
            <User className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">As Party</span>
            <span className="sm:hidden">Party</span>
          </button>
        </div>

        {/* Notifications Dropdown */}
        <div ref={notificationsRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setUserMenuOpen(false);
            }}
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={notificationsOpen}
            className="relative flex size-10 items-center justify-center rounded-xl border border-[#e8ecf3] bg-white text-[#003a5e] shadow-sm transition-colors duration-200 hover:border-sky-200 hover:bg-sky-50 cursor-pointer"
          >
            <Bell className="size-4" aria-hidden="true" />
            {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold tabular-nums text-white ring-2 ring-white">{unreadCount}</span>}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-[#e8ecf3] bg-white p-4 shadow-lg animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-[#e8ecf3] pb-3">
                <h2 className="font-display text-sm font-bold text-[#003a5e]">Notifications</h2>
                {unreadCount > 0 && (
                  <button type="button" onClick={() => markAllRead.mutate()} className="inline-flex items-center gap-1 text-xs font-semibold text-[#0068a3] hover:text-[#003a5e] cursor-pointer">
                    <CheckCheck className="size-3.5" aria-hidden="true" />Mark all read
                  </button>
                )}
              </div>
              {hasNotifications ? (
                <ul className="max-h-72 divide-y divide-[#e8ecf3] overflow-y-auto">
                  {notifications.map((notification) => (
                    <li key={notification.id} className="py-3 first:pt-3 last:pb-0">
                      <button
                        type="button"
                        onClick={() => !notification.is_read && markRead.mutate(notification.id)}
                        className="w-full text-left cursor-pointer"
                      >
                        <p className={`text-sm leading-5 text-[#003a5e] ${notification.is_read ? 'font-normal' : 'font-semibold'}`}>{notification.message}</p>
                        <time className="mt-1 block text-xs text-slate-500">{new Date(notification.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</time>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No notifications yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Popover */}
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen((open) => !open);
              setNotificationsOpen(false);
            }}
            aria-label="User menu"
            aria-expanded={userMenuOpen}
            className="flex size-10 items-center justify-center overflow-hidden rounded-xl border border-[#e8ecf3] bg-[#003a5e] text-xs font-bold text-white shadow-sm transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer"
          >
            {user?.avatar_url ? (
               
              <img src={user.avatar_url} alt="" className="size-full object-cover" />
            ) : (
              user?.full_name?.charAt(0).toUpperCase() || 'U'
            )}
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-[#e8ecf3] bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-[#e8ecf3] mb-1">
                <span className="block text-xs font-bold text-[#003a5e] truncate">{user?.full_name || 'My Profile'}</span>
                <span className="block text-[10px] text-slate-400 truncate">{user?.email || 'Logged in'}</span>
              </div>

              <Link
                href="/settings?tab=profile"
                prefetch={true}
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#003a5e] hover:bg-slate-50 transition-colors"
              >
                <CircleUserRound className="size-4 text-[#0068a3]" />
                <span>My Profile</span>
              </Link>

              <Link
                href="/settings"
                prefetch={true}
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#003a5e] hover:bg-slate-50 transition-colors"
              >
                <Settings className="size-4 text-[#0068a3]" />
                <span>Settings</span>
              </Link>

              <div className="border-t border-[#e8ecf3] my-1 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="size-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
