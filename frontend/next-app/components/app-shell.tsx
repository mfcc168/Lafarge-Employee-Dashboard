"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  Home,
  KeyRound,
  LogOut,
  Menu,
  ReceiptText,
  Users,
  WalletCards,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  MANAGEMENT_ROLES,
  PAYROLL_ROLES,
  SALES_ROLES,
  type UserRole,
} from "@/lib/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  roles?: UserRole[];
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/report", label: "Reports", icon: ClipboardList, roles: SALES_ROLES },
  { href: "/client", label: "Clients", icon: BriefcaseBusiness, roles: SALES_ROLES },
  { href: "/sales", label: "Sales", icon: BarChart3, roles: SALES_ROLES },
  { href: "/vacation", label: "Vacation", icon: CalendarDays },
  { href: "/payroll", label: "Payroll", icon: WalletCards, roles: PAYROLL_ROLES },
  { href: "/employees", label: "Employees", icon: Users, roles: MANAGEMENT_ROLES },
];

function ShellLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f8]">
      <div className="flex items-center gap-3 text-sm font-medium text-[#69717d]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#cfd4da] border-t-[#34383e]" />
        Loading workspace…
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!loading && !user && !isLogin) {
      router.replace("/login");
    }
    if (!loading && user && isLogin) {
      router.replace("/");
    }
  }, [isLogin, loading, router, user]);

  const visibleNav = useMemo(
    () =>
      navItems.filter(
        (item) => !item.roles || (!!user && item.roles.includes(user.role)),
      ),
    [user],
  );

  if (isLogin) return <>{children}</>;
  if (loading || !user) return <ShellLoading />;

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[236px] border-r border-[#e4e7eb] bg-white/95 px-3 py-4 lg:flex lg:flex-col">
        <Link href="/" className="flex items-center gap-3 px-3 py-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#202327] text-lg font-bold text-white">
            L
          </span>
          <div>
            <div className="font-semibold tracking-tight">Lafarge</div>
            <div className="text-xs text-[#8a929c]">Employee workspace</div>
          </div>
        </Link>

        <nav className="mt-7 space-y-1">
          {visibleNav.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#eef0f2] text-[#17191c]"
                    : "text-[#656d77] hover:bg-[#f5f6f7] hover:text-[#262a2f]"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl bg-[#f5f6f7] p-3">
          <div className="text-sm font-semibold text-[#30343a]">
            {user.firstname || user.username} {user.lastname}
          </div>
          <div className="mt-0.5 text-xs text-[#7a828c]">{user.role}</div>
        </div>
      </aside>

      <div className="lg:pl-[236px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e5e8eb] bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <Menu size={19} className="text-[#69717d]" />
            <span className="font-semibold">Lafarge</span>
          </div>
          <div className="hidden text-sm text-[#747c86] lg:block">
            Welcome, <span className="font-medium text-[#34383e]">{user.firstname || user.username}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/change-password" className="btn-secondary !px-3 !py-2 text-sm">
              <KeyRound size={16} />
              <span className="hidden sm:inline">Password</span>
            </Link>
            <button onClick={handleLogout} className="btn-secondary !px-3 !py-2 text-sm">
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex gap-1 overflow-x-auto border-t border-[#e1e5e9] bg-white/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        {visibleNav.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[68px] flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium ${
                active ? "bg-[#eef0f2] text-[#202327]" : "text-[#737b85]"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
