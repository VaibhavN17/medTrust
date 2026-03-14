'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Menu, X, Bell, ChevronDown, LogOut, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const { user, logout, fetchMe } = useAuth();
  const [open,    setOpen]    = useState(false);
  const [scroll,  setScroll]  = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetchMe();
    const onScroll = () => setScroll(window.scrollY > 16);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dashPath = user
    ? user.role === 'patient' ? '/dashboard/patient'
    : user.role === 'donor'   ? '/dashboard/donor'
    : '/dashboard/admin'
    : '/login';

  const navLinks = [
    { href: '/campaigns', label: 'Browse Campaigns' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/about', label: 'About' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scroll
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-teal-500 flex items-center justify-center shadow-md group-hover:shadow-brand-200 transition-shadow">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="font-display font-bold text-xl text-slate-900">
            Med<span className="text-brand-500">Trust</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === l.href
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdown(!dropdown)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-teal-400 flex items-center justify-center text-white text-xs font-bold">
                  {user.name[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-700">{user.name.split(' ')[0]}</span>
                <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', dropdown && 'rotate-180')} />
              </button>

              {dropdown && (
                <div className="absolute right-0 mt-1 w-52 card border border-slate-100 py-1.5 animate-fade-in">
                  <Link href={dashPath} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setDropdown(false)}>
                    <LayoutDashboard className="w-4 h-4 text-brand-500" /> Dashboard
                  </Link>
                  <Link href="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setDropdown(false)}>
                    <User className="w-4 h-4 text-slate-400" /> Profile
                  </Link>
                  <div className="border-t border-slate-100 my-1" />
                  <button onClick={logout} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-coral-500 hover:bg-coral-50">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="btn-outline py-2 text-sm">Sign In</Link>
              <Link href="/register" className="btn-primary py-2 text-sm">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-1 animate-fade-in">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <div className="border-t border-slate-100 pt-3 mt-3 flex flex-col gap-2">
            {user ? (
              <>
                <Link href={dashPath} className="btn-primary text-sm" onClick={() => setOpen(false)}>Dashboard</Link>
                <button onClick={logout} className="btn-outline text-sm">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/login"    className="btn-outline" onClick={() => setOpen(false)}>Sign In</Link>
                <Link href="/register" className="btn-primary"  onClick={() => setOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
