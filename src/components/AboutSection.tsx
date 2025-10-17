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

      {/* Support Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Coffee className="h-5 w-5 text-primary" />
            <CardTitle>Support Development</CardTitle>
          </div>
          <CardDescription>
            Help keep OpenIDE running for students everywhere
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If OpenIDE helped you pass a class, finish a project, or learn something new, 
            consider buying me a coffee! It helps cover AI costs and keeps this project 
            running for students everywhere.
          </p>
          <Button 
            className="w-full" 
            onClick={() => window.open('https://buymeacoffee.com/treytrey', '_blank', 'noopener,noreferrer')}
          >
            <Coffee className="mr-2 h-4 w-4" />
            Buy Me a Coffee
          </Button>
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Built with 💜 by <span className="font-semibold">@treytrey</span>
            </p>
            <p className="text-xs text-muted-foreground">Data Science Student</p>
            <a 
              href="mailto:fbarfiel@gmu.edu" 
              className="text-xs text-primary hover:underline block mt-1"
            >
              fbarfiel@gmu.edu
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
