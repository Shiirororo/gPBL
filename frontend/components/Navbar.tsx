"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Code, SignOut, SquaresFour, Trophy, User } from "@phosphor-icons/react";

import { logout } from "@/features/auth/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// ─── Nav links definition ─────────────────────────────────────────────────────

const NAV_LINKS = [
  {
    href: "/challenge",
    label: "Challenges",
    icon: SquaresFour,
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    icon: Trophy,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
  },
] as const;

// ─── Nav Link Item ────────────────────────────────────────────────────────────

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "group relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
        active
          ? "bg-foreground/10 text-foreground"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
      ].join(" ")}
    >
      <Icon
        size={14}
        className={[
          "transition-colors duration-200",
          active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
        ].join(" ")}
      />
      {label}

      {/* Active indicator pill */}
      {active && (
        <span className="absolute bottom-0 left-1/2 h-px w-4/5 -translate-x-1/2 rounded-full bg-foreground/40" />
      )}
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { clearCurrentUser } = useCurrentUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();
      clearCurrentUser();
      router.replace("/login");
      router.refresh();
    } catch (cause) {
      setLogoutError(cause instanceof Error ? cause.message : "Unable to log out.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-12 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-md">
      {/* ── Logo ── */}
      <Link
        href="/challenge"
        className="flex items-center gap-2 text-sm font-semibold text-foreground transition-opacity hover:opacity-80"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
          <Code size={13} weight="bold" />
        </span>
        <span className="tracking-tight">gPBL</span>
      </Link>

      {/* ── Centre nav ── */}
      <nav className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label, icon }) => (
          <NavLink
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={pathname === href || pathname.startsWith(href + "/")}
          />
        ))}
      </nav>

      {/* ── Right side: avatar ── */}
      <div className="flex items-center gap-2">
        {logoutError && (
          <span role="alert" className="max-w-48 truncate text-[10px] text-red-400" title={logoutError}>
            {logoutError}
          </span>
        )}
        <button
          type="button"
          id="navbar-user-avatar"
          aria-label="Open profile"
          onClick={() => router.push("/profile")}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/10 text-foreground ring-1 ring-border transition-all hover:bg-foreground/20"
        >
          <User size={13} />
        </button>
        <button
          type="button"
          aria-label="Log out"
          disabled={isLoggingOut}
          onClick={() => void handleLogout()}
          className="flex h-7 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SignOut size={13} />
          <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
        </button>
      </div>
    </header>
  );
}
