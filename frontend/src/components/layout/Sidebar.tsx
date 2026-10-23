'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Bell,
  CreditCard,
  HelpCircle,
  Settings,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, setSidebarOpen, user, logout } = useAuthStore();

  // Responsiveness listener on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  // Close sidebar drawer on mobile after navigation
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname, setSidebarOpen]);

  const handleToggle = () => {
    toggleSidebar();
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
  };

  const menuSections = [
    {
      title: 'WORKSPACE',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Agreements', href: '/agreements', icon: FileText },
        { name: 'Notifications', href: '/notifications', icon: Bell },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { name: 'Settings', href: '/settings', icon: Settings },
        { name: 'Plans & Billing', href: '/settings?tab=billing', icon: CreditCard },
        { name: 'Help & Support', href: '/settings?tab=support', icon: HelpCircle },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={handleToggle}
        />
      )}

      {/* Main navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex shrink-0 select-none flex-col overflow-hidden lg:relative lg:overflow-visible ${
          sidebarOpen
            ? 'w-[265px] p-5 translate-x-0 visible bg-white/90 backdrop-blur-2xl border-r border-[#e8ecf3] lg:border lg:border-slate-200/70 lg:rounded-[32px] lg:my-3 lg:ml-3 lg:shadow-[0_16px_45px_rgba(0,58,94,0.08)] lg:h-[calc(100vh-1.5rem)] lg:justify-between scale-100 opacity-100'
            : 'w-0 p-0 -translate-x-[265px] invisible bg-white/90 backdrop-blur-2xl border-r border-[#e8ecf3] lg:visible lg:w-[76px] lg:py-4 lg:px-2.5 lg:translate-x-0 lg:border lg:border-slate-200/70 lg:rounded-[36px] lg:my-auto lg:self-center lg:ml-3 lg:shadow-[0_16px_45px_rgba(0,58,94,0.08)] lg:h-fit lg:max-h-[85vh]'
        }`}
      >
        {/* Brand Header & Toggle */}
        <div className={`relative z-10 flex items-center shrink-0 transition-all duration-300 ${
          sidebarOpen ? 'justify-between px-1 h-12 mb-5' : 'justify-center h-12 mb-2'
        }`}>
          {sidebarOpen ? (
            <div className="flex items-center justify-between w-full animate-in fade-in zoom-in-95 duration-300">
              <Link href="/dashboard" prefetch={true} className="flex items-center gap-2.5 select-none group min-w-0 flex-1 mr-1">
                { }
                <img
                  src="/apple-touch-icon.png"
                  alt="AgreeMate Logo"
                  className="size-9 object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[17px] font-bold font-display text-[#003a5e] tracking-tight leading-none">
                    Agree<span className="font-serif italic text-[#0ea5e9] font-normal">Mate</span>
                  </span>
                  <span
                    className="text-[9px] text-[#003a5e]/60 font-semibold tracking-tight leading-tight mt-1 truncate"
                    title="Lend with trust and borrow with proof."
                  >
                    Lend with trust and borrow with proof.
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={handleToggle}
                className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200/70 bg-slate-50/90 text-[#003a5e] shadow-sm transition-transform duration-200 active:scale-95 hover:bg-slate-100 cursor-pointer"
                aria-label="Collapse sidebar"
              >
                <X className="w-4 h-4 lg:hidden" />
                <Menu className="w-4 h-4 hidden lg:block" />
              </button>
            </div>
          ) : (
            <div className="relative group mx-auto flex flex-col items-center">
              <button
                type="button"
                onClick={handleToggle}
                className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200/70 bg-white text-[#003a5e] shadow-sm transition-all duration-200 active:scale-95 hover:bg-slate-50 cursor-pointer p-1.5"
                aria-label="Expand sidebar"
              >
                { }
                <img
                  src="/apple-touch-icon.png"
                  alt="AgreeMate Logo"
                  className="size-8 object-contain"
                />
              </button>
              <span className="absolute left-[64px] scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 origin-left px-3 py-1.5 rounded-xl bg-[#003a5e] text-white text-[11px] font-bold shadow-xl whitespace-nowrap z-50">
                AgreeMate · Lend with trust and borrow with proof.
              </span>
            </div>
          )}
        </div>

        {/* Nav Menu Container */}
        <div
          key={pathname}
          className={`relative z-10 flex-1 flex flex-col select-none no-scrollbar overflow-x-hidden ${
            sidebarOpen ? 'px-0.5 min-h-0 overflow-y-auto' : 'px-0 overflow-visible'
          }`}
        >
          {menuSections.map((section, sectionIdx) => (
            <div key={section.title} className={`${sectionIdx > 0 ? (sidebarOpen ? 'mt-6' : 'mt-2') : ''} flex flex-col gap-1.5`}>
              {/* Section Header or Hairline Divider */}
              {sidebarOpen ? (
                <span className="text-[10px] font-mono font-extrabold text-[#003a5e]/45 uppercase tracking-widest px-3 mb-1 animate-in fade-in zoom-in-95 duration-200">
                  {section.title}
                </span>
              ) : (
                <div className="w-6 h-[1px] bg-slate-200/80 mx-auto my-1 shrink-0" />
              )}

              {/* Navigation Items */}
              <div className="flex flex-col gap-1.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    (item.href === '/dashboard' && pathname === '/dashboard') ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      prefetch={true}
                      className={`flex items-center transition-all duration-300 relative group cursor-pointer ${
                        sidebarOpen
                          ? 'w-full px-3.5 h-[48px] gap-3.5 justify-start rounded-2xl'
                          : 'w-[48px] h-[48px] justify-center mx-auto rounded-2xl'
                      } ${
                        isActive
                          ? 'bg-[#003a5e] text-white font-bold shadow-md shadow-[#003a5e]/15'
                          : 'text-[#003a5e] hover:bg-slate-50 hover:text-[#005080] font-semibold'
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 transition-all duration-300 relative z-10 ${
                        isActive
                          ? 'text-[#0ea5e9]'
                          : 'text-[#003a5e]/60 group-hover:text-[#0ea5e9] group-hover:scale-110'
                      }`} />

                      {sidebarOpen && (
                        <span className={`text-xs whitespace-nowrap leading-none transition-all duration-300 relative z-10 animate-in fade-in zoom-in-95 ${
                          isActive
                            ? 'text-white font-bold'
                            : 'text-[#003a5e] group-hover:translate-x-0.5'
                        }`}>
                          {item.name}
                        </span>
                      )}

                      {/* Tooltip on Collapsed Desktop View */}
                      {!sidebarOpen && (
                        <span className="absolute left-[64px] scale-95 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 origin-left px-3 py-1.5 rounded-xl bg-[#003a5e] text-white text-[11px] font-bold shadow-xl whitespace-nowrap z-50">
                          {item.name}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Footer Profile & Sign Out */}
        <div className={`relative z-10 shrink-0 border-t border-[#e8ecf3] pt-3 ${sidebarOpen ? 'mt-4 flex items-center justify-between gap-2' : 'mt-3 flex flex-col gap-2'}`}>
          <Link
            href="/settings?tab=profile"
            prefetch={true}
            aria-label="Open my profile"
            className={`group flex items-center rounded-2xl text-[#003a5e] transition-colors duration-200 hover:bg-slate-50 min-w-0 ${sidebarOpen ? 'gap-3 px-2 py-2 flex-1' : 'mx-auto size-12 justify-center'}`}
          >
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0068a3] text-sm font-bold text-white shadow-sm">
              {user?.avatar_url ? (
                 
                <img src={user.avatar_url} alt="" className="size-full object-cover" />
              ) : (
                user?.full_name?.charAt(0).toUpperCase() || 'U'
              )}
            </span>
            {sidebarOpen ? (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{user?.full_name || 'My profile'}</span>
                <span className="block truncate text-xs text-slate-500">{user?.email || 'Manage account'}</span>
              </span>
            ) : (
              <span className="absolute left-[64px] scale-95 whitespace-nowrap rounded-xl bg-[#003a5e] px-3 py-1.5 text-[11px] font-bold text-white opacity-0 pointer-events-none transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 z-50">
                My Profile
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            title="Sign out of AgreeMate"
            className={`flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-500 transition-colors duration-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer shadow-xs ${sidebarOpen ? 'size-10 shrink-0' : 'size-12 mx-auto'}`}
            aria-label="Sign out"
          >
            <LogOut className="size-4 shrink-0" />
            {!sidebarOpen && (
              <span className="absolute left-[64px] scale-95 whitespace-nowrap rounded-xl bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white opacity-0 pointer-events-none transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 z-50">
                Sign Out
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
