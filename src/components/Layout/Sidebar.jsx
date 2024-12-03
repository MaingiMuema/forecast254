/* eslint-disable @typescript-eslint/no-unused-vars */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ChartBarIcon,
  WalletIcon,
  ArrowsRightLeftIcon,
  ClockIcon,
  TrophyIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowLeftOnRectangleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { FaChartLine } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export const sidebarLinks = [
  { name: "Markets", href: "/dashboard", icon: HomeIcon },
  { name: "Portfolio", href: "/dashboard/portfolio", icon: ChartBarIcon },
  { name: "Wallet", href: "/dashboard/wallet", icon: WalletIcon },
  {
    name: "Transactions",
    href: "/dashboard/transactions",
    icon: ArrowsRightLeftIcon,
  },
  { name: "Settings", href: "/dashboard/settings", icon: Cog6ToothIcon },
  { name: "Help", href: "/dashboard/help", icon: QuestionMarkCircleIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, loading, role, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  

  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 px-6">
      <div className="flex h-16 shrink-0 items-center">
        <Link href="/" className="flex items-center space-x-2">
            <FaChartLine className="text-emerald-400 text-2xl" />
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Forecast254
            </span>
          </Link>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {sidebarLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      pathname === item.href
                        ? "bg-gray-50 dark:bg-gray-800 text-primary"
                        : "text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800",
                      "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                    )}
                  >
                    <item.icon
                      className={cn(
                        pathname === item.href
                          ? "text-primary"
                          : "text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white",
                        "h-6 w-6 shrink-0"
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
              {(role === 'admin' || role === 'validator') && (
                <>
                  {role === 'admin' && (
                    <li>
                      <Link
                        href="/dashboard/admin"
                        className={cn(
                          pathname === '/dashboard/admin'
                            ? "bg-gray-50 dark:bg-gray-800 text-primary"
                            : "text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800",
                          "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                        )}
                      >
                        <ShieldCheckIcon
                          className={cn(
                            pathname === '/dashboard/admin'
                              ? "text-primary"
                              : "text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white",
                            "h-6 w-6 shrink-0"
                          )}
                          aria-hidden="true"
                        />
                        Admin
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link
                      href="/dashboard/admin/validator"
                      className={cn(
                        pathname === '/dashboard/admin/validator'
                          ? "bg-gray-50 dark:bg-gray-800 text-primary"
                          : "text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800",
                        "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                      )}
                    >
                      <ShieldCheckIcon
                        className={cn(
                          pathname === '/dashboard/admin/validator'
                            ? "text-primary"
                            : "text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white",
                          "h-6 w-6 shrink-0"
                        )}
                        aria-hidden="true"
                      />
                      Validator
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </li>
          <li className="mt-auto">
            <button
              onClick={handleSignOut}
              className="w-full group flex items-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <ArrowLeftOnRectangleIcon
                className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                aria-hidden="true"
              />
              Sign Out
            </button>
            <div className="flex flex-col gap-4 py-4 text-sm">
              <p className="text-gray-500 dark:text-gray-400">
                &copy; 2024 Forecast254. All rights reserved.
              </p>
            </div>
          </li>
        </ul>
      </nav>
    </div>
  );
}