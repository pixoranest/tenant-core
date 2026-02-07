import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Play, FileText, Mic, MoreVertical, Tag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import type { RecordingRow } from "@/hooks/useRecordings";

function formatDuration(seconds: number | null) {
  if (!seconds) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface Props {
  recordings: RecordingRow[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onPlay: (recording: RecordingRow) => void;
  onArchive: (id: string) => void;
}

export default function RecordingsListView({ recordings, selectedIds, onSelect, onSelectAll, onPlay, onArchive }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={selectedIds.size === recordings.length && recordings.length > 0}
              onCheckedChange={onSelectAll}
            />
          </TableHead>
          <TableHead className="w-10"></TableHead>
          <TableHead>Phone Number</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Outcome</TableHead>
          <TableHead>Tags</TableHead>
          <TableHead>Transcript</TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recordings.map((r) => (
          <TableRow key={r.id} className="cursor-pointer" onClick={() => onPlay(r)}>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <Checkbox checked={selectedIds.has(r.id)} onCheckedChange={() => onSelect(r.id)} />
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onPlay(r); }}>
                <Play className="h-3.5 w-3.5" />
              </Button>
            </TableCell>
            <TableCell className="font-mono text-sm">{r.caller_phone ?? "Unknown"}</TableCell>
            <TableCell className="text-sm whitespace-nowrap">
              {format(new Date(r.call_timestamp), "MMM d, yyyy · h:mm a")}
            </TableCell>
            <TableCell className="font-mono text-sm">{formatDuration(r.duration)}</TableCell>
            <TableCell className="text-sm max-w-[120px] truncate">{r.outcome ?? "—"}</TableCell>
            <TableCell>
              <div className="flex gap-1 flex-wrap">
                {(r.tags ?? []).slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] h-5">{tag}</Badge>
                ))}
                {(r.tags ?? []).length > 2 && (
                  <Badge variant="secondary" className="text-[10px] h-5">+{(r.tags!).length - 2}</Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
              {r.transcript_text ? (
                <FileText className="h-3.5 w-3.5 text-primary" />
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              )}
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onPlay(r)}>Play</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => onArchive(r.id)}>Archive</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
