import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tag, Download, Archive, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Props {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkTag: (tag: string) => void;
  onBulkArchive: () => void;
}

export default function BulkActions({ selectedCount, onClearSelection, onBulkTag, onBulkArchive }: Props) {
  const [tagInput, setTagInput] = useState("");

  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
      <Badge variant="secondary" className="text-xs">{selectedCount} selected</Badge>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
            <Tag className="h-3 w-3" /> Add Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2">
          <Input
            placeholder="Enter tag…"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagInput.trim()) {
                onBulkTag(tagInput.trim());
                setTagInput("");
              }
            }}
            className="h-7 text-xs"
          />
        </PopoverContent>
      </Popover>

      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled>
        <Download className="h-3 w-3" /> Download
      </Button>

      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={onBulkArchive}>
        <Archive className="h-3 w-3" /> Archive
      </Button>

      <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={onClearSelection}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
