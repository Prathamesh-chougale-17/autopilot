"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await authClient.signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Failed to sign out:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleSignOut} variant="outline" disabled={loading}>
      {loading ? (
        <>
          <Spinner className="mr-2 h-4 w-4" />
          Signing out...
        </>
      ) : (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </>
      )}
    </Button>
  );
}
