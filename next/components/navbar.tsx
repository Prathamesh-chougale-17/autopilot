"use client";

import { AnimatedThemeToggler } from "./theme-toggle";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2">
          <h1 className="text-base sm:text-lg font-bold">Algo Games</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
          <AnimatedThemeToggler />
        </div>
      </div>
    </nav>
  );
}
