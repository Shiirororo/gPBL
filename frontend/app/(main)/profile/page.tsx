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
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        toast("Logged out", "success");
        router.push("/auth/login");
      } else {
        toast("Failed to log out", "error");
      }
    } catch {
      toast("Failed to log out", "error");
    } finally {
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
