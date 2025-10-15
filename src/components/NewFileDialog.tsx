import { useState } from "react";
import { FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewFileDialogProps {
  onCreateFile: (name: string, type: string) => void;
}

const FILE_TEMPLATES = {
  python: {
    extension: '.py',
    template: '# Python Script\n\nprint("Hello, World!")\n',
  },
  r: {
    extension: '.r',
    template: '# R Script\n\nprint("Hello, World!")\n',
  },
  rmarkdown: {
    extension: '.rmd',
    template: `---
title: "Untitled"
output: html_document
---

\`\`\`{r setup, include=FALSE}
knitr::opts_chunk$set(echo = TRUE)
\`\`\`

## R Markdown Document

This is an R Markdown document.

\`\`\`{r}
summary(cars)
\`\`\`
`,
  },
  text: {
    extension: '.txt',
    template: '',
  },
};

export const NewFileDialog = ({ onCreateFile }: NewFileDialogProps) => {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<keyof typeof FILE_TEMPLATES>("python");

  const handleCreate = () => {
    if (!fileName.trim()) return;
    
    const template = FILE_TEMPLATES[fileType];
    const fullName = fileName.includes('.') 
      ? fileName 
      : fileName + template.extension;
    
    onCreateFile(fullName, template.template);
    
    // Reset and close
    setFileName("");
    setFileType("python");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          <FilePlus className="w-4 h-4 mr-2" />
          New File
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New File</DialogTitle>
          <DialogDescription>
            Create a new Python, R, or text file to start coding.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file-type">File Type</Label>
            <Select
              value={fileType}
              onValueChange={(value) => setFileType(value as keyof typeof FILE_TEMPLATES)}
            >
              <SelectTrigger id="file-type">
                <SelectValue placeholder="Select file type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="python">Python (.py)</SelectItem>
                <SelectItem value="r">R Script (.r)</SelectItem>
                <SelectItem value="rmarkdown">R Markdown (.rmd)</SelectItem>
                <SelectItem value="text">Text File (.txt)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="file-name">File Name</Label>
            <Input
              id="file-name"
              placeholder="script"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <p className="text-xs text-muted-foreground">
              Extension will be added automatically
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleCreate} disabled={!fileName.trim()}>
            Create File
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
