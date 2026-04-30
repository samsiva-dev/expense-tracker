"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { IndianRupee, LayoutDashboard, List, LogOut, Landmark, RefreshCw, TrendingUp, CreditCard } from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/expenses", label: "Expenses", icon: List },
    { href: "/loans", label: "Loans", icon: Landmark },
    { href: "/subscriptions", label: "Subs", icon: RefreshCw },
    { href: "/income", label: "Income", icon: TrendingUp },
    { href: "/emis", label: "EMIs", icon: CreditCard },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-lg group-hover:bg-indigo-700 transition-colors">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg hidden md:block">
              Expense<span className="text-indigo-600">Tracker</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden sm:flex items-center gap-0.5">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden lg:block">{label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Section */}
          {session?.user && (
            <div className="flex items-center gap-2">
              <NotificationBell />
              <div className="hidden sm:flex items-center gap-2">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? "User"}
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-indigo-100"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                    {session.user.name?.charAt(0) ?? "U"}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate hidden lg:block">
                  {session.user.name}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-1.5 px-2.5 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:block">Sign out</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Nav Links — icon only */}
        <div className="sm:hidden flex gap-0.5 pb-2 overflow-x-auto">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                title={label}
              >
                <Icon className="w-4 h-4" />
                <span className="sr-only">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
