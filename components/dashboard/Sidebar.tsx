"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Calendar, Scissors, Users, UserCheck,
  Settings, LogOut, ExternalLink, ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Tenant } from "@/lib/db/schema";

const NAV = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "לוח בקרה" },
  { href: "/appointments", icon: Calendar,        label: "תורים"    },
  { href: "/services",     icon: Scissors,        label: "שירותים"  },
  { href: "/staff",        icon: UserCheck,       label: "צוות"     },
  { href: "/customers",    icon: Users,           label: "לקוחות"   },
  { href: "/settings",     icon: Settings,        label: "הגדרות"   },
];

export function Sidebar({ tenant }: { tenant: Tenant }) {
  const pathname = usePathname();
  const router   = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const accent = tenant.primaryColor ?? "#0284C7";

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white border-l border-gray-100 h-full shrink-0">

      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shrink-0"
          style={{ background: accent }}
        >
          {tenant.name[0]}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-sm truncate leading-tight">{tenant.name}</p>
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{tenant.category ?? "עסק"}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto no-scrollbar">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon
                size={16}
                strokeWidth={active ? 2.5 : 2}
                className={active ? "text-white" : "text-gray-400"}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 p-3 flex flex-col gap-0.5">
        <Link
          href={`/book/${tenant.slug}`}
          target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-brand-50 hover:text-brand-700 transition-all group"
        >
          <ExternalLink size={15} className="text-gray-400 group-hover:text-brand-500 transition-colors" />
          <span className="flex-1">עמוד ההזמנות</span>
          <ChevronLeft size={13} className="text-gray-300 group-hover:text-brand-400 transition-colors" />
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-500 transition-all w-full text-right group"
        >
          <LogOut size={15} className="text-gray-400 group-hover:text-red-400 transition-colors" />
          יציאה
        </button>
      </div>
    </aside>
  );
}
