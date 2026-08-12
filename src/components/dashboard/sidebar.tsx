"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Proposals", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  orgName,
  userEmail,
}: {
  orgName: string;
  userEmail: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-background">
      <div className="flex items-center gap-2 border-b px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{orgName}</p>
          <p className="text-xs text-muted-foreground">Proposal Studio</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-2 rounded-md px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {(userEmail ?? "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{userEmail}</p>
        </div>
        <form action={signOut}>
          <Button variant="ghost" size="sm" className="mt-1 w-full justify-start text-muted-foreground">
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
