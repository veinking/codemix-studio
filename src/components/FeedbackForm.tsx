import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bug, Lightbulb, HelpCircle, MessageSquare, CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'question', 'general']),
  subject: z.string()
    .min(3, "Subject must be at least 3 characters")
    .max(200, "Subject must be less than 200 characters")
    .trim(),
  message: z.string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be less than 2000 characters")
    .trim(),
  email: z.string()
    .email("Invalid email address")
    .optional()
    .or(z.literal('')),
});

type FeedbackType = 'bug' | 'feature' | 'question' | 'general';

const feedbackTypes: { value: FeedbackType; label: string; icon: any; description: string }[] = [
  { value: 'bug', label: 'Bug Report', icon: Bug, description: 'Report an issue or error' },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb, description: 'Suggest a new feature' },
  { value: 'question', label: 'Question', icon: HelpCircle, description: 'Ask for help' },
  { value: 'general', label: 'General Feedback', icon: MessageSquare, description: 'Share your thoughts' },
];

export const FeedbackForm = () => {
  const location = useLocation();
  const [type, setType] = useState<FeedbackType>('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    const result = feedbackSchema.safeParse({ type, subject, message, email });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('feedback').insert({
        type,
        subject: subject.trim(),
        message: message.trim(),
        email: email.trim() || null,
        user_agent: navigator.userAgent,
        page_context: location.pathname,
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Thank you!",
        description: "Your feedback has been received.",
      });
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Submission failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setType('bug');
    setSubject('');
    setMessage('');
    setEmail('');
    setIsSubmitted(false);
    setErrors({});
  };

  if (isSubmitted) {
    return (
      <Card className="p-6 text-center space-y-4">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Thank you!</h3>
          <p className="text-sm text-muted-foreground">
            We received your feedback and will review it soon.
          </p>
        </div>
        <Button onClick={handleReset} variant="outline" className="w-full">
          Send Another
        </Button>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <Label>Feedback Type</Label>
        <RadioGroup value={type} onValueChange={(value) => setType(value as FeedbackType)}>
          {feedbackTypes.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.value} className="flex items-start space-x-3 space-y-0">
                <RadioGroupItem value={item.value} id={item.value} />
                <Label
                  htmlFor={item.value}
                  className="font-normal cursor-pointer flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject *</Label>
        <Input
          id="subject"
          placeholder="Brief description..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={200}
          className={errors.subject ? "border-destructive" : ""}
        />
        {errors.subject && (
          <p className="text-xs text-destructive">{errors.subject}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message *</Label>
        <Textarea
          id="message"
          placeholder="Describe your feedback..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={2000}
          rows={6}
          className={errors.message ? "border-destructive" : ""}
        />
        <div className="flex justify-between items-center">
          {errors.message ? (
            <p className="text-xs text-destructive">{errors.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {message.length}/2000 characters
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email (optional)</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={errors.email ? "border-destructive" : ""}
        />
        <p className="text-xs text-muted-foreground">
          Provide your email if you'd like a response
        </p>
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send Feedback"
        )}
      </Button>
    </form>
  );
};
