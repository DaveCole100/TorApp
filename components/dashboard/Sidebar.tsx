"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Calendar, Scissors, Users, UserCheck,
  Settings, LogOut, ExternalLink,
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

  return (
    <aside className="hidden md:flex flex-col w-60 border-l border-gray-100 bg-white h-full shrink-0">

      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
          style={{ background: tenant.primaryColor }}>
          {tenant.name[0]}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-sm truncate">{tenant.name}</p>
          <p className="text-[11px] text-gray-400 truncate">{tenant.category ?? "עסק"}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon size={17} className={cn(active ? "text-brand-600" : "text-gray-400")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 p-3 flex flex-col gap-1">
        <Link href={`/book/${tenant.slug}`} target="_blank"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all">
          <ExternalLink size={17} className="text-gray-400" />
          עמוד ההזמנות
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all w-full text-right">
          <LogOut size={17} className="text-gray-400" />
          יציאה
        </button>
      </div>
    </aside>
  );
}
