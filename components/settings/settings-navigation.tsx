"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Settings, Users } from "lucide-react";

const navItems = [
  {
    title: "General",
    href: "/settings/general",
    icon: Settings,
  },
  {
    title: "Personas",
    href: "/settings/personas",
    icon: Users,
  },
];

export function SettingsNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-1 border-b">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:text-foreground",
              "border-b-2 border-transparent",
              isActive
                ? "border-primary text-foreground"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}