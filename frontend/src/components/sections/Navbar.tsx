'use client';

import { useState, useEffect } from 'react';
import { LogIn, UserPlus, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 150;
      if (isAtBottom && pathname === '/') {
        setActiveSection('#faq');
      } else if (window.scrollY < 120 && pathname === '/') {
        setActiveSection('#hero');
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    let observer: IntersectionObserver | null = null;
    const observedElements: HTMLElement[] = [];

    // Delay observer setup slightly to guarantee hydration and DOM completion
    const timer = setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection('#' + entry.target.id);
            }
          });
        },
        { rootMargin: '-25% 0px -35% 0px', threshold: 0.05 }
      );

      const ids = ['hero', 'problem', 'how-it-works', 'features', 'about', 'faq'];
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el && observer) {
          observer.observe(el);
          observedElements.push(el);
        }
      });
    }, 300);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
      if (observer) {
        observedElements.forEach((el) => observer?.unobserve(el));
      }
    };
  }, [pathname]);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/#how-it-works', label: 'How It Works' },
    { href: '/#features', label: 'Features' },
    { href: '/#about', label: 'About Us' },
    { href: '/#faq', label: 'FAQ' },
    { href: '/pricing', label: 'Pricing' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname === '/' && href.startsWith('/#')) {
      const targetId = href.substring(2);
      const el = document.getElementById(targetId);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
        setActiveSection('#' + targetId);
        setMenuOpen(false);
      }
    } else if (pathname === '/' && href === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveSection('#hero');
      setMenuOpen(false);
    }
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-10 py-4 sm:py-6 transition-all duration-300 ${scrolled ? 'bg-canvas/80 backdrop-blur-md shadow-sm border-b border-hairline-strong py-3 sm:py-4' : 'bg-transparent'
        }`}>
        {/* Brand Logo */}
        <Link href="/" onClick={(e) => handleNavClick(e, '/')} className="flex items-center gap-2.5 text-[#003a5e] hover:scale-[1.02] active:scale-[0.98] transition-all">
          <img
            src="/apple-touch-icon.png"
            alt="AgreeMate Logo"
            width={32}
            height={32}
            loading="eager"
            decoding="async"
            className="h-8 w-8 object-contain"
          />
          <span className="font-display text-base sm:text-lg md:text-xl font-bold tracking-tight text-[#003a5e] select-none">
            Agree<span className="font-serif italic text-[#0ea5e9] font-normal">Mate</span>
          </span>
        </Link>

        {/* Center Floating Pill links */}
        <div className="hidden lg:flex items-center gap-1 bg-white rounded-full pl-6 pr-1 py-1 shadow-sm border border-hairline">
          {navLinks.map((link) => {
            const isMatch =
              (pathname !== '/' && pathname === link.href) ||
              (pathname === '/' && (
                (link.href === '/' && (activeSection === '#hero' || activeSection === '#' || activeSection === '')) ||
                (link.href.startsWith('/#') && activeSection === link.href.substring(1))
              ));
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-2 transition-colors ${isMatch ? 'text-primary' : 'text-muted hover:text-ink'
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link href="/signup" className="ml-2 bg-primary hover:bg-[#005080] text-white text-[10px] font-extrabold uppercase tracking-widest px-5 py-2.5 rounded-full transition-colors">
            Try it Live
          </Link>
        </div>

        {/* Right side CTAs */}
        <div className="flex items-center gap-3 sm:gap-6 text-[#003a5e]">
          <Link href="/signup" className="hidden sm:flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest hover:text-primary transition-all">
            <UserPlus className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Sign Me Up!</span>
          </Link>
          <Link href="/login" className="flex items-center gap-1.5 sm:gap-2 text-[10px] font-extrabold uppercase tracking-widest hover:text-primary transition-all bg-white/50 px-3 py-1.5 rounded-full border border-white/60 shadow-sm">
            <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            Login
          </Link>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="lg:hidden relative flex items-center justify-center w-10 h-10 rounded-full bg-white border border-hairline text-ink transition-all duration-300 hover:bg-canvas-soft"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <Menu
              className={`w-5 h-5 absolute transition-all duration-300 ${menuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
                }`}
            />
            <X
              className={`w-5 h-5 absolute transition-all duration-300 ${menuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
                }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setMenuOpen(false)}
      >
        <div className="absolute inset-0 bg-[#081119]/30" />
      </div>

      {/* Mobile menu drawer */}
      <div
        className={`lg:hidden fixed top-0 right-0 bottom-0 z-40 w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full pt-24 px-8 pb-8">
          <div className="flex flex-col gap-1">
            {navLinks.map((link, i) => {
              const isMatch =
                (pathname !== '/' && pathname === link.href) ||
                (pathname === '/' && (
                  (link.href === '/' && (activeSection === '#hero' || activeSection === '#' || activeSection === '')) ||
                  (link.href.startsWith('/#') && activeSection === link.href.substring(1))
                ));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`text-xl font-extrabold uppercase tracking-widest py-4 border-b border-hairline transition-all duration-500 ${isMatch ? 'text-primary border-primary/20' : 'text-ink border-hairline/60'
                    } ${menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
                    }`}
                  style={{ transitionDelay: menuOpen ? `${150 + i * 70}ms` : '0ms' }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div
            className={`mt-8 flex flex-col gap-4 transition-all duration-500 ${menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
              }`}
            style={{ transitionDelay: menuOpen ? '400ms' : '0ms' }}
          >
            <Link href="/signup" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink sm:hidden">
              <UserPlus className="w-4 h-4 text-primary" />
              Sign Me Up!
            </Link>
            <Link href="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink sm:hidden">
              <LogIn className="w-4 h-4 text-primary" />
              Login
            </Link>
            <Link href="/signup" onClick={() => setMenuOpen(false)} className="mt-2 bg-primary hover:bg-[#005080] text-white text-xs font-extrabold uppercase tracking-widest px-5 py-3 rounded-full text-center transition-colors">
              Try it Live
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
