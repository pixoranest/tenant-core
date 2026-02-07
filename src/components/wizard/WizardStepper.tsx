import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  "Basic Info",
  "Agent & Features",
  "Billing",
  "Integrations",
  "Notifications & Security",
];

interface Props {
  currentStep: number;
  completedSteps: number[];
}

export default function WizardStepper({ currentStep, completedSteps }: Props) {
  return (
    <div className="flex items-center gap-1 w-full px-1">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = completedSteps.includes(step);
        const isFuture = step > currentStep && !isCompleted;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 min-w-0">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isCompleted && !isActive && "bg-primary/20 text-primary",
                  isFuture && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted && !isActive ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] leading-tight text-center max-w-[80px]",
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1 mx-1 mt-[-16px]",
                  isCompleted ? "bg-primary/40" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
