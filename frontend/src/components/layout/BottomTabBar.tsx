'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Store, FileText, Settings } from 'lucide-react';

export default function BottomTabBar() {
  const pathname = usePathname();

  const tabs = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Khata', href: '/khatabook', icon: Store },
    { name: 'Agreements', href: '/agreements', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-hairline px-4 flex items-center justify-around z-30 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname.startsWith(tab.href);
          
        return (
          <Link
            key={tab.name}
            href={tab.href}
            prefetch={true}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors relative ${
              isActive ? 'text-primary' : 'text-muted-soft'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-[9px] font-bold tracking-tight uppercase">{tab.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
