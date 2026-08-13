"use client";

import ProfileForm from "@/components/ProfileForm";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SignOut } from "@phosphor-icons/react";

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // The logout endpoint returns a redirect, which fetch will follow
      const res = await fetch("/api/auth/logout", { 
        method: "POST",
        redirect: "manual" // Don't follow redirect automatically
      });
      
      if (res.ok || res.type === "opaqueredirect" || res.status === 0) {
        toast("Logged out", "success");
        // Force full page navigation to login
        window.location.href = "/auth/login";
      } else {
        toast("Failed to log out", "error");
        setLoading(false);
      }
    } catch {
      toast("Failed to log out", "error");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl p-6 space-y-6">
      <ProfileForm />
      <div className="flex justify-end">
        <Button
          variant="destructive"
          onClick={() => void handleLogout()}
          disabled={loading}
          className="gap-2 rounded-xl"
        >
          <SignOut size={16} weight="bold" />
          {loading ? "Logging out…" : "Log out"}
        </Button>
      </div>
    </div>
  );
}
