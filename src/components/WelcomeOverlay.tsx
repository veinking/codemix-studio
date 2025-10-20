import { useState, useEffect } from "react";
import { X, Play, FileCode, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface WelcomeOverlayProps {
  onDismiss: () => void;
}

export const WelcomeOverlay = ({ onDismiss }: WelcomeOverlayProps) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <FileCode className="w-12 h-12 text-primary" />,
      title: "Welcome to bIDE",
      description: "Your browser-based Python & R IDE. Everything runs locally on your device.",
    },
    {
      icon: <Play className="w-12 h-12 text-primary" />,
      title: "Write & Run Code",
      description: "Use the editor to write code, then hit the Run button. Your code executes entirely in-browser using WebAssembly.",
    },
    {
      icon: <Database className="w-12 h-12 text-primary" />,
      title: "Work with Data",
      description: "Upload CSV files, create visualizations, and use built-in data science tools. All your files are saved locally.",
    },
  ];

  useEffect(() => {
    if (step < steps.length - 1) {
      const timer = setTimeout(() => setStep(step + 1), 3000);
      return () => clearTimeout(timer);
    }
  }, [step, steps.length]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <Card className="relative max-w-lg w-full p-8 space-y-6 bg-card border-2 border-primary/20 shadow-2xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="absolute top-4 right-4"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 rounded-full bg-primary/10">
            {steps[step].icon}
          </div>
          
          <h2 className="text-2xl font-bold text-foreground">
            {steps[step].title}
          </h2>
          
          <p className="text-muted-foreground leading-relaxed">
            {steps[step].description}
          </p>

          {/* Progress indicators */}
          <div className="flex gap-2 pt-4">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === step
                    ? "w-8 bg-primary"
                    : idx < step
                    ? "w-2 bg-primary/50"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          {step === steps.length - 1 && (
            <Button
              onClick={onDismiss}
              className="mt-4 bg-primary hover:bg-primary/90"
            >
              Get Started
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
