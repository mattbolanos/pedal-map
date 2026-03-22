import { MoonStarsIcon } from "@phosphor-icons/react/dist/csr/MoonStars";
import { SunIcon } from "@phosphor-icons/react/dist/csr/Sun";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Kbd } from "./ui/kbd";

type ThemeMode = "light" | "dark";
type StoredThemeMode = ThemeMode | "auto";

function getSystemTheme(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredThemeMode(): StoredThemeMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark" || stored === "auto") {
    return stored;
  }

  return null;
}

function resolveThemeMode(mode: StoredThemeMode | null): ThemeMode {
  return mode === "light" || mode === "dark" ? mode : getSystemTheme();
}

function applyThemeMode(mode: ThemeMode) {
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(mode);
  document.documentElement.setAttribute("data-theme", mode);

  document.documentElement.style.colorScheme = mode;
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("light");

  useHotkey("D", () => toggleMode());

  useEffect(() => {
    const initialMode = resolveThemeMode(getStoredThemeMode());
    setMode(initialMode);
    applyThemeMode(initialMode);
    window.localStorage.setItem("theme", initialMode);
  }, []);

  function toggleMode() {
    const nextMode: ThemeMode = mode === "light" ? "dark" : "light";
    setMode(nextMode);
    applyThemeMode(nextMode);
    window.localStorage.setItem("theme", nextMode);
  }

  const nextMode = mode === "light" ? "dark" : "light";
  const label = `Theme mode: ${mode}. Click to switch to ${nextMode} mode.`;

  return (
    <Button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      variant="outline"
      size="sm"
      className="flex items-center gap-x-2 shadow-xl"
    >
      <span className="relative flex size-4 items-center justify-center">
        <SunIcon
          className={cn(
            "absolute inset-0 size-4 transition-all duration-250 ease-[cubic-bezier(0.23,1,0.32,1)]",
            mode === "dark"
              ? "blur-0 scale-100 rotate-0 opacity-100"
              : "scale-50 -rotate-90 opacity-0 blur-[2px]",
          )}
        />
        <MoonStarsIcon
          className={cn(
            "absolute inset-0 size-4 transition-all duration-250 ease-[cubic-bezier(0.23,1,0.32,1)]",
            mode === "light"
              ? "blur-0 scale-100 rotate-0 opacity-100"
              : "scale-50 rotate-90 opacity-0 blur-[2px]",
          )}
        />
      </span>
      <span className="font-medium">Theme</span>
      <Kbd className="ml-3">D</Kbd>
    </Button>
  );
}
