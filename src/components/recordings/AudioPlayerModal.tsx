import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Download, Share2,
  Archive, ChevronDown, ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import TranscriptPanel from "./TranscriptPanel";
import TagsSection from "./TagsSection";
import NotesSection from "./NotesSection";
import { parseTranscript } from "@/hooks/useRecordings";
import type { RecordingRow } from "@/hooks/useRecordings";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface Props {
  recording: RecordingRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allTags: string[];
  onUpdateTags: (id: string, tags: string[]) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onTrackPlayback: (id: string) => void;
  onArchive: (id: string) => void;
}

export default function AudioPlayerModal({
  recording, open, onOpenChange, allTags,
  onUpdateTags, onUpdateNotes, onTrackPlayback, onArchive,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState("1");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [hasTracked, setHasTracked] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const transcriptLines = parseTranscript(recording?.transcript_text ?? null);

  // Reset state on recording change
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setHasTracked(false);
  }, [recording?.id]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
      if (!hasTracked && recording) {
        onTrackPlayback(recording.id);
        setHasTracked(true);
      }
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, hasTracked, recording, onTrackPlayback]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const skip = useCallback((delta: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + delta));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case " ": e.preventDefault(); togglePlay(); break;
        case "ArrowLeft": e.preventDefault(); skip(-10); break;
        case "ArrowRight": e.preventDefault(); skip(10); break;
        case "ArrowUp": e.preventDefault(); setVolume((v) => Math.min(1, v + 0.1)); break;
        case "ArrowDown": e.preventDefault(); setVolume((v) => Math.max(0, v - 0.1)); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, togglePlay, skip]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  // Sync playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = parseFloat(speed);
    }
  }, [speed]);

  if (!recording) return null;

  const recordingDuration = recording.duration ?? 0;
  const dataEntries = recording.data_collected
    ? Object.entries(recording.data_collected).filter(([, v]) => v !== null && v !== undefined && v !== "")
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto p-0">
        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={recording.recording_url ?? undefined}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? recordingDuration)}
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
        />

        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-base">
            Call with {recording.caller_phone ?? "Unknown"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {format(new Date(recording.call_timestamp), "EEEE, MMMM d, yyyy · h:mm a")}
          </p>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row">
          {/* Left: Player + Details */}
          <div className="flex-[3] p-6 space-y-4 border-r border-border">
            {/* Waveform placeholder */}
            <div className="relative h-20 bg-gradient-to-r from-primary/5 to-accent/10 rounded-lg flex items-end px-2 pb-2 gap-[1px] overflow-hidden">
              {Array.from({ length: 100 }).map((_, i) => {
                const progress = duration > 0 ? currentTime / duration : 0;
                const barProgress = i / 100;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 rounded-full min-w-[2px] transition-colors",
                      barProgress <= progress ? "bg-primary" : "bg-muted-foreground/20"
                    )}
                    style={{ height: `${Math.max(10, Math.random() * 100)}%` }}
                  />
                );
              })}
            </div>

            {/* Time */}
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration || recordingDuration)}</span>
            </div>

            {/* Progress scrubber */}
            <Slider
              min={0}
              max={duration || recordingDuration || 1}
              step={0.1}
              value={[currentTime]}
              onValueChange={([v]) => seek(v)}
              className="mb-2"
            />

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => skip(-10)}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => skip(10)}>
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            {/* Speed + Volume + Actions */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Select value={speed} onValueChange={setSpeed}>
                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["0.5", "0.75", "1", "1.25", "1.5", "2"].map((s) => (
                      <SelectItem key={s} value={s}>{s}×</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMuted(!muted)}>
                    {muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  </Button>
                  <Slider
                    min={0} max={1} step={0.01}
                    value={[muted ? 0 : volume]}
                    onValueChange={([v]) => { setVolume(v); setMuted(false); }}
                    className="w-20"
                  />
                </div>
              </div>

              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled title="Download">
                  <Download className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled title="Share">
                  <Share2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Call Details (collapsible) */}
            <button
              className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setDetailsOpen(!detailsOpen)}
            >
              Call Details
              {detailsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {detailsOpen && (
              <div className="space-y-3 animate-in slide-in-from-top-1">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Detail label="Duration" value={formatDuration(recordingDuration)} />
                  <Detail label="Status" value={recording.status ?? "—"} />
                  <Detail label="Outcome" value={recording.outcome ?? "—"} />
                  <Detail label="Cost" value={recording.cost ? `$${recording.cost.toFixed(2)}` : "—"} />
                  <Detail label="Agent" value={recording.agent_name ?? "Unassigned"} />
                  <Detail label="Plays" value={String(recording.playback_count ?? 0)} />
                </div>

                {dataEntries.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Data Collected</p>
                    <div className="bg-muted/50 rounded p-2 text-xs font-mono space-y-0.5">
                      {dataEntries.map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{key}:</span>
                          <span className="text-foreground">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <Separator />
            <div className="space-y-1.5">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs" disabled>
                Add to Playlist (coming soon)
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs" disabled>
                Mark for Training (coming soon)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs text-destructive hover:text-destructive"
                onClick={() => { onArchive(recording.id); onOpenChange(false); }}
              >
                <Archive className="mr-2 h-3 w-3" /> Archive Recording
              </Button>
            </div>
          </div>

          {/* Right: Transcript + Tags + Notes */}
          <div className="flex-[2] p-6 space-y-4 overflow-y-auto">
            <TranscriptPanel
              lines={transcriptLines}
              currentTime={currentTime}
              onSeek={seek}
            />

            <Separator />

            <TagsSection
              tags={recording.tags ?? []}
              allTags={allTags}
              onUpdate={(tags) => onUpdateTags(recording.id, tags)}
            />

            <Separator />

            <NotesSection
              notes={recording.notes ?? ""}
              onSave={(notes) => onUpdateNotes(recording.id, notes)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground text-[10px]">{label}</span>
      <p className="text-foreground font-medium mt-0.5">{value}</p>
    </div>
  );
}
