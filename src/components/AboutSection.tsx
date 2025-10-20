import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, Heart } from "lucide-react";

export const AboutSection = () => {
  return (
    <div className="space-y-4">
      {/* Mission Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-primary" />
            <CardTitle>Why OpenIDE Exists</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm space-y-3 text-muted-foreground">
            <p>
              I'm a broke college student working on my data science master's degree. 
              I needed something to help me code on my phone - whether I was on the bus, 
              between classes, or anywhere without my laptop.
            </p>
            <p>
              I couldn't afford expensive mobile IDEs, and the free options either required 
              accounts, had paywalls, or just didn't work well.
            </p>
            <p className="font-semibold text-foreground">
              So I built OpenIDE.
            </p>
            <p>
              OpenIDE is <strong>100% free for students</strong> because I know what it's 
              like to need tools but not have the budget.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
