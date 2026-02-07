import { useState, useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ChevronUp, ChevronDown, Download, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TranscriptLine } from "@/hooks/useRecordings";

interface Props {
  lines: TranscriptLine[];
  currentTime: number;
  onSeek: (time: number) => void;
}

export default function TranscriptPanel({ lines, currentTime, onSeek }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    return lines
      .map((l, i) => ({ index: i, line: l }))
      .filter(({ line }) => line.text.toLowerCase().includes(q));
  }, [lines, searchQuery]);

  const currentLineIndex = useMemo(() => {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].timestamp <= currentTime) return i;
    }
    return -1;
  }, [lines, currentTime]);

  // Auto-scroll to current line
  useEffect(() => {
    if (currentLineIndex >= 0 && containerRef.current && !searchQuery) {
      const el = containerRef.current.querySelector(`[data-line="${currentLineIndex}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentLineIndex, searchQuery]);

  const formatTimestamp = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    const q = searchQuery.toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-primary/30 text-foreground rounded px-0.5">{text.slice(idx, idx + searchQuery.length)}</mark>
        {text.slice(idx + searchQuery.length)}
      </>
    );
  };

  const copyToClipboard = () => {
    const text = lines.map((l) => `[${formatTimestamp(l.timestamp)}] ${l.speaker === "agent" ? "Agent" : "Customer"}: ${l.text}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = () => {
    const text = lines.map((l) => `[${formatTimestamp(l.timestamp)}] ${l.speaker === "agent" ? "Agent" : "Customer"}: ${l.text}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transcript.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">Transcript not available for this call.</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="full" className="h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-2">
        <TabsList className="h-8">
          <TabsTrigger value="full" className="text-xs h-6 px-2">Full Transcript</TabsTrigger>
          <TabsTrigger value="highlights" className="text-xs h-6 px-2" disabled>Key Highlights</TabsTrigger>
        </TabsList>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyToClipboard} title="Copy">
            {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={downloadTxt} title="Download TXT">
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <TabsContent value="full" className="flex-1 flex flex-col mt-0 space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search transcript…"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setMatchIndex(0); }}
            className="h-7 text-xs pl-7 pr-20"
          />
          {matches.length > 0 && (
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <span className="text-[10px] text-muted-foreground mr-1">{matchIndex + 1}/{matches.length}</span>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setMatchIndex((i) => (i - 1 + matches.length) % matches.length)}>
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setMatchIndex((i) => (i + 1) % matches.length)}>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Transcript lines */}
        <div ref={containerRef} className="flex-1 overflow-y-auto space-y-1 max-h-[400px] pr-1">
          {lines.map((line, i) => (
            <div
              key={i}
              data-line={i}
              className={cn(
                "flex gap-2 p-2 rounded-md text-xs transition-colors cursor-pointer hover:bg-muted/50",
                line.speaker === "agent" ? "bg-accent/30" : "bg-muted/30",
                currentLineIndex === i && "ring-1 ring-primary/50 bg-primary/10",
                matches[matchIndex]?.index === i && "ring-2 ring-primary"
              )}
              onClick={() => onSeek(line.timestamp)}
            >
              <button className="text-[10px] font-mono text-primary shrink-0 hover:underline" onClick={() => onSeek(line.timestamp)}>
                {formatTimestamp(line.timestamp)}
              </button>
              <div className="min-w-0">
                <span className={cn("text-[10px] font-semibold", line.speaker === "agent" ? "text-primary" : "text-muted-foreground")}>
                  {line.speaker === "agent" ? "Agent" : "Customer"}
                </span>
                <p className="text-foreground mt-0.5">{highlightText(line.text)}</p>
              </div>
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="highlights" className="mt-0">
        <div className="py-8 text-center text-sm text-muted-foreground">
          Key Highlights — coming soon
        </div>
      </TabsContent>
    </Tabs>
  );
}
