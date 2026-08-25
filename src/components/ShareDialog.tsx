import { useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Loader2, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { QRCodeSVG } from 'qrcode.react';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  language: string;
  fileName?: string;
}

const CATEGORIES = [
  { value: 'data-analysis', label: '📊 Data Analysis' },
  { value: 'machine-learning', label: '🤖 Machine Learning' },
  { value: 'visualization', label: '📈 Visualization' },
  { value: 'web-scraping', label: '🕷️ Web Scraping' },
  { value: 'utility', label: '🔧 Utility' },
  { value: 'education', label: '📚 Education' },
  { value: 'game', label: '🎮 Game' },
  { value: 'other', label: '📦 Other' },
];

export const ShareDialog = ({ open, onOpenChange, code, language, fileName }: ShareDialogProps) => {
  const { isGuest } = useAuth();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresIn, setExpiresIn] = useState<string>("never");
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");

  const handleShare = async () => {
    if (isGuest) {
      toast.error("Sign in to create a share link");
      return;
    }

    if (!code.trim()) {
      toast.error("No code to share");
      return;
    }

    if (!category) {
      toast.error("Please select a category");
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    if (description.trim().length > 200) {
      toast.error("Description must be less than 200 characters");
      return;
    }

    setIsGenerating(true);
    try {
      let expiresAt: Date | null = null;
      if (expiresIn !== "never") {
        const days = Number.parseInt(expiresIn, 10);
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        toast.error("Your session expired. Sign in again to share code.");
        return;
      }

      const { data: shortId, error } = await (supabase.rpc as any)('create_shared_code', {
        p_code: code,
        p_language: language,
        p_file_name: fileName || null,
        p_expires_at: expiresAt?.toISOString() || null,
        p_category: category,
        p_description: description.trim(),
        p_tags: tags.length > 0 ? tags : null,
      });

      if (error) throw error;
      if (!shortId) throw new Error("Share service did not return an identifier");

      const url = `${window.location.origin}/share/${shortId}`;
      setShareUrl(url);
      toast.success("Share link created!");
    } catch (error: any) {
      console.error("Share error:", error);
      toast.error(error?.message || "Failed to create share link");
    } finally {
      setIsGenerating(false);
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (!trimmedTag) return;

    if (trimmedTag.length > 30) {
      toast.error("Tags are limited to 30 characters");
      return;
    }
    
    if (tags.length >= 5) {
      toast.error("Maximum 5 tags allowed");
      return;
    }
    
    if (tags.includes(trimmedTag)) {
      toast.error("Tag already added");
      return;
    }
    
    setTags([...tags, trimmedTag]);
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleClose = () => {
    setShareUrl(null);
    setCopied(false);
    setExpiresIn("never");
    setCategory("");
    setDescription("");
    setTags([]);
    setTagInput("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Code</DialogTitle>
          <DialogDescription>
            Create an unlisted link for your code. Anyone with the link can view it.
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          isGuest ? (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                Sign in with your PocketBI ID to create an unlisted share link. Viewing a link does not require an account.
              </div>
              <Button asChild className="w-full">
                <Link to="/auth" onClick={handleClose}>Sign in to share</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category <span className="text-destructive">*</span></Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Description <span className="text-destructive">*</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({description.length}/200 chars)
                  </span>
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this code do? (10-200 characters)"
                  className="min-h-[80px]"
                  maxLength={200}
                />
                {description.length > 0 && description.length < 10 && (
                  <p className="text-xs text-destructive">Minimum 10 characters required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tags (Optional, max 5)</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Add tags like 'pandas', 'matplotlib'..."
                    maxLength={30}
                    disabled={tags.length >= 5}
                  />
                  <Button 
                    onClick={addTag} 
                    variant="outline"
                    disabled={tags.length >= 5 || !tagInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                          aria-label={`Remove ${tag} tag`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Link Expires</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleShare} 
                disabled={isGenerating || !category || description.trim().length < 10}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Link...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Create Share Link
                  </>
                )}
              </Button>
            </div>
          )
        ) : (
          <Tabs defaultValue="link" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">Link</TabsTrigger>
              <TabsTrigger value="qr">QR Code</TabsTrigger>
            </TabsList>
            
            <TabsContent value="link" className="space-y-4">
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input 
                    value={shareUrl} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    onClick={handleCopy}
                    size="icon"
                    variant="outline"
                    aria-label="Copy share link"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {expiresIn === "never" 
                  ? "This link will never expire" 
                  : `This link expires in ${expiresIn} day${expiresIn === "1" ? "" : "s"}`}
              </div>
            </TabsContent>

            <TabsContent value="qr" className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-lg">
                  <QRCodeSVG 
                    value={shareUrl} 
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Scan this QR code to open the shared code
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
