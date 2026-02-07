import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Play, MoreVertical, Download, Share2, Tag, StickyNote, Archive, FileText, Mic } from "lucide-react";
import { format } from "date-fns";
import type { RecordingRow } from "@/hooks/useRecordings";

function formatDuration(seconds: number | null) {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatPhone(phone: string | null) {
  if (!phone) return "Unknown";
  return phone;
}

interface RecordingCardProps {
  recording: RecordingRow;
  selected: boolean;
  onSelect: (id: string) => void;
  onPlay: (recording: RecordingRow) => void;
  onArchive: (id: string) => void;
  onTagClick?: (tag: string) => void;
}

export default function RecordingCard({ recording, selected, onSelect, onPlay, onArchive, onTagClick }: RecordingCardProps) {
  const tagsToShow = (recording.tags ?? []).slice(0, 3);
  const extraTags = (recording.tags ?? []).length - 3;

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
      {/* Selection checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onSelect(recording.id)}
          className="bg-background/80 backdrop-blur-sm"
        />
      </div>

      {/* Duration badge */}
      <div className="absolute top-3 right-3 z-10">
        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs font-mono">
          {formatDuration(recording.duration)}
        </Badge>
      </div>

      {/* Waveform visual placeholder */}
      <div
        className="relative h-32 bg-gradient-to-br from-primary/10 to-accent/30 flex items-center justify-center cursor-pointer"
        onClick={() => onPlay(recording)}
      >
        {/* Fake waveform bars */}
        <div className="flex items-end gap-[2px] h-12 opacity-50">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full bg-primary"
              style={{ height: `${Math.max(8, Math.random() * 100)}%` }}
            />
          ))}
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-foreground/10 backdrop-blur-[1px]">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-sm font-medium text-foreground truncate">
              {formatPhone(recording.caller_phone)}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(recording.call_timestamp), "MMM d, yyyy · h:mm a")}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPlay(recording)}>
                <Play className="mr-2 h-3.5 w-3.5" /> Play
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Download className="mr-2 h-3.5 w-3.5" /> Download
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Share2 className="mr-2 h-3.5 w-3.5" /> Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPlay(recording)}>
                <Tag className="mr-2 h-3.5 w-3.5" /> Add Tag
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPlay(recording)}>
                <StickyNote className="mr-2 h-3.5 w-3.5" /> Add Note
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => onArchive(recording.id)}>
                <Archive className="mr-2 h-3.5 w-3.5" /> Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-1">
          {recording.recording_url && (
            <Badge variant="outline" className="text-[10px] gap-1 h-5">
              <Mic className="h-2.5 w-2.5" /> Recording
            </Badge>
          )}
          {recording.transcript_text && (
            <Badge variant="outline" className="text-[10px] gap-1 h-5">
              <FileText className="h-2.5 w-2.5" /> Transcript
            </Badge>
          )}
          {tagsToShow.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] h-5 cursor-pointer hover:bg-primary/20"
              onClick={() => onTagClick?.(tag)}
            >
              {tag}
            </Badge>
          ))}
          {extraTags > 0 && (
            <Badge variant="secondary" className="text-[10px] h-5">+{extraTags} more</Badge>
          )}
        </div>

        {/* Notes preview */}
        {recording.notes && (
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                <StickyNote className="h-2.5 w-2.5 shrink-0" />
                {recording.notes.slice(0, 100)}
              </p>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{recording.notes}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </Card>
  );
}
