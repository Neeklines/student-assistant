import { MessageSquarePlus, CalendarPlus, LayoutGrid } from "lucide-react";
import { Card } from "@/components/ui.jsx";

const STEPS = [
  {
    Icon: MessageSquarePlus,
    title: "Napisz do Buddy'ego",
    subtitle: "np. „zaplanuj mi naukę jutro po 16”",
  },
  {
    Icon: CalendarPlus,
    title: "Buddy doda wydarzenia",
    subtitle: "Twój plan pojawi się w kalendarzu obok",
  },
  {
    Icon: LayoutGrid,
    title: "Przełączaj widoki",
    subtitle: "Dzień / tydzień / miesiąc w kalendarzu",
  },
];

export default function OnboardingHints() {
  return (
    <Card className="mb-6 p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <p className="mb-4 text-sm font-semibold text-foreground">Zacznij w 3 krokach 👇</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {STEPS.map(({ Icon, title, subtitle }) => (
          <div key={title} className="flex items-start gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: "var(--gradient-hero)" }}
            >
              <Icon className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
