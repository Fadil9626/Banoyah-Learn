import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../theme";

const OPTIONS = [
  { key: "light", icon: Sun, label: "Light" },
  { key: "dark", icon: Moon, label: "Dark" },
  { key: "system", icon: Monitor, label: "System" },
];

// Segmented light / dark / system control.
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="inline-flex items-center gap-0.5 p-1 rounded-xl bg-surface-2 border border-line">
      {OPTIONS.map(({ key, icon: Icon, label }) => {
        const active = theme === key;
        return (
          <button
            key={key}
            onClick={() => setTheme(key)}
            title={label}
            aria-pressed={active}
            className={`flex items-center justify-center w-8 h-7 rounded-lg transition ${
              active
                ? "bg-surface text-brand shadow-sm"
                : "text-faint hover:text-content"
            }`}
          >
            <Icon size={15} />
          </button>
        );
      })}
    </div>
  );
}
