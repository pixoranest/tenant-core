import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";

const suggestedTags = ["Important", "Follow-up", "Training", "Complaint"];

interface Props {
  tags: string[];
  allTags: string[];
  onUpdate: (tags: string[]) => void;
}

export default function TagsSection({ tags, allTags, onUpdate }: Props) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const autocomplete = useMemo(() => {
    if (!input) return [];
    const q = input.toLowerCase();
    return allTags.filter((t) => t.toLowerCase().includes(q) && !tags.includes(t)).slice(0, 5);
  }, [input, allTags, tags]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onUpdate([...tags, trimmed]);
    }
    setInput("");
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onUpdate(tags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Tags</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 text-xs">
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-destructive">
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
      </div>

      <div className="relative">
        <Input
          placeholder="Add tag…"
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(input); } }}
          className="h-8 text-xs"
        />
        {showSuggestions && autocomplete.length > 0 && (
          <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-popover border rounded-md shadow-md p-1 space-y-0.5">
            {autocomplete.map((tag) => (
              <button
                key={tag}
                className="w-full text-left text-xs px-2 py-1 rounded hover:bg-accent"
                onClick={() => addTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Suggested tags */}
      <div className="flex flex-wrap gap-1">
        {suggestedTags.filter((t) => !tags.includes(t)).map((tag) => (
          <Button
            key={tag}
            variant="outline"
            size="sm"
            className="h-6 text-[10px] gap-0.5"
            onClick={() => addTag(tag)}
          >
            <Plus className="h-2.5 w-2.5" /> {tag}
          </Button>
        ))}
      </div>
    </div>
  );
}
