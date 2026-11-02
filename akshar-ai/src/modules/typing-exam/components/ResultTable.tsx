import type { ReactNode } from "react";
import {
  ChartNoAxesCombined,
  FileText,
  Gauge,
  Target,
  TextSearch,
} from "lucide-react";

export type ResultTabId =
  | "overview"
  | "speed"
  | "words"
  | "analytics"
  | "passage";

const tabs = [
  { id: "overview", label: "Overview", icon: ChartNoAxesCombined },
  { id: "speed", label: "Speed & accuracy", icon: Gauge },
  { id: "words", label: "Word analysis", icon: TextSearch },
  { id: "analytics", label: "Performance insights", icon: Target },
  { id: "passage", label: "Passage & details", icon: FileText },
] as const;

export function ResultTabs({
  activeTab,
  onChange,
}: {
  activeTab: ResultTabId;
  onChange: (tab: ResultTabId) => void;
}) {
  return (
    <nav
      aria-label="Result sections"
      className="overflow-x-auto rounded-xl border border-[#343b3f] bg-[#1b1f22] p-2 print:hidden"
    >
      <div className="flex min-w-max gap-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={active ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold outline-none transition-colors ${
                active
                  ? "bg-[#83c4ae] text-[#14211c]"
                  : "text-[#aeb6b2] hover:bg-[#252a2e] hover:text-[#e5e7e6]"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function ResultTabPanel({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  if (!active) return null;
  return <div className="space-y-5">{children}</div>;
}
