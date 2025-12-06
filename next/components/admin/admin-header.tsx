"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { Session } from "@/lib/auth";

interface AdminHeaderProps {
  session: Session;
}

export function AdminHeader({ session }: AdminHeaderProps) {
  return (
    <div className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-amber-500" />
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-white">{session.user.name}</p>
            <p className="text-xs text-zinc-400">{session.user.role}</p>
          </div>
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
