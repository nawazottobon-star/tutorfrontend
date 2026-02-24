import { useEffect, useMemo, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DASHBOARD_CARD_SHADOW, DASHBOARD_GRADIENT_BG, FONT_INTER_STACK } from "@/constants/theme";
import { SiteHeader, type SiteHeaderProps } from "./SiteHeader";

interface SiteLayoutProps {
  children: ReactNode;
  headerProps?: SiteHeaderProps;
  showHeader?: boolean;
  className?: string;
  contentClassName?: string;
  mainProps?: HTMLAttributes<HTMLElement>;
}

export function SiteLayout({
  children,
  headerProps,
  showHeader = true,
  className,
  contentClassName,
  mainProps,
}: SiteLayoutProps) {
  const [storedIsAuthenticated, setStoredIsAuthenticated] = useState(false);
  const [storedUser, setStoredUser] = useState<SiteHeaderProps["user"]>();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncAuthState = () => {
      try {
        const isAuthed = window.localStorage.getItem("isAuthenticated") === "true";
        setStoredIsAuthenticated(isAuthed);

        if (isAuthed) {
          const rawUser = window.localStorage.getItem("user");
          if (rawUser) {
            const parsed = JSON.parse(rawUser) as Partial<{ fullName?: string; name?: string; email?: string; picture?: string }>;
            const displayName = parsed.fullName?.trim() || parsed.name?.trim() || "Learner";

            setStoredUser({
              name: displayName,
              email: parsed.email ?? "",
              avatarUrl: parsed.picture,
              initials: displayName
                .split(" ")
                .filter(Boolean)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase(),
            });
            return;
          }
        }

        setStoredUser(undefined);
      } catch (error) {
        console.error("Failed to sync header auth state", error);
        setStoredUser(undefined);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === "user" || event.key === "isAuthenticated" || event.key === "session") {
        syncAuthState();
      }
    };

    syncAuthState();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const mergedHeaderProps = useMemo(() => {
    if (!showHeader) {
      return undefined;
    }

    return {
      ...headerProps,
      isAuthenticated: headerProps?.isAuthenticated ?? storedIsAuthenticated,
      user: headerProps?.user ?? storedUser,
    };
  }, [headerProps, showHeader, storedIsAuthenticated, storedUser]);

  const { className: mainClassName, style: mainStyle, ...restMainProps } = mainProps ?? {};

  return (
    <div
      className={cn(FONT_INTER_STACK, "min-h-screen w-full")}
      style={{ background: DASHBOARD_GRADIENT_BG }}
    >
      <div className="w-full">
        <main
          {...restMainProps}
          className={cn(
            "relative transition-all duration-500 min-h-screen",
            mainClassName,
            className,
          )}
        >
          <div
            className={cn(
              "animate-in fade-in slide-in-from-bottom-4 duration-500",
              contentClassName,
            )}
          >
            {showHeader ? <SiteHeader {...mergedHeaderProps} /> : null}
            <div className="px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

