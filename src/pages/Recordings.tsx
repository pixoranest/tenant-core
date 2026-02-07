import { useState, useCallback } from "react";
import { useRecordings, RecordingRow } from "@/hooks/useRecordings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LayoutGrid, List, Mic } from "lucide-react";
import RecordingCard from "@/components/recordings/RecordingCard";
import RecordingsListView from "@/components/recordings/RecordingsListView";
import RecordingFilters from "@/components/recordings/RecordingFilters";
import SmartCollections from "@/components/recordings/SmartCollections";
import AudioPlayerModal from "@/components/recordings/AudioPlayerModal";
import BulkActions from "@/components/recordings/BulkActions";
import { toast } from "@/hooks/use-toast";

export default function Recordings() {
  const rec = useRecordings();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [playerRecording, setPlayerRecording] = useState<RecordingRow | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);
  const [bulkArchiveOpen, setBulkArchiveOpen] = useState(false);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!rec.data) return;
    if (selectedIds.size === rec.data.rows.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(rec.data.rows.map((r) => r.id)));
  }, [rec.data, selectedIds]);

  const handleArchive = useCallback(async () => {
    if (!archiveTarget) return;
    rec.archiveRecording.mutate(archiveTarget, {
      onSuccess: () => toast({ title: "Recording archived" }),
    });
    setArchiveTarget(null);
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(archiveTarget); return n; });
  }, [archiveTarget, rec.archiveRecording]);

  const handleBulkArchive = useCallback(() => {
    rec.bulkArchive.mutate(Array.from(selectedIds), {
      onSuccess: () => { toast({ title: `${selectedIds.size} recordings archived` }); setSelectedIds(new Set()); },
    });
    setBulkArchiveOpen(false);
  }, [selectedIds, rec.bulkArchive]);

  const totalPages = rec.data ? Math.ceil(rec.data.total / rec.PAGE_SIZE) : 0;

  return (
    <div className="flex gap-6">
      {/* Sidebar: Smart Collections */}
      <div className="hidden lg:block w-48 shrink-0">
        <SmartCollections
          current={rec.collection}
          onChange={(key) => rec.setParam("col", key)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 space-y-4 min-w-0">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Call Recordings & Transcripts</h1>
          <div className="flex items-center gap-1 border rounded-md p-0.5">
            <Button
              variant={rec.viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => rec.setParam("view", "grid")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={rec.viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => rec.setParam("view", "list")}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <RecordingFilters
              search={rec.search}
              dateFilter={rec.dateFilter}
              sortBy={rec.sortBy}
              outcomeFilter={rec.outcomeFilter}
              hasRecording={rec.hasRecording}
              hasTranscript={rec.hasTranscript}
              hasTagged={rec.hasTagged}
              hasNotes={rec.hasNotes}
              minDuration={rec.minDuration}
              maxDuration={rec.maxDuration}
              activeFilterCount={rec.activeFilterCount}
              setParam={rec.setParam}
              clearFilters={rec.clearFilters}
            />
          </CardContent>
        </Card>

        {/* Bulk actions */}
        <BulkActions
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          onBulkTag={(tag) => {
            rec.bulkUpdateTags.mutate({ ids: Array.from(selectedIds), tag }, {
              onSuccess: () => toast({ title: `Tag "${tag}" added to ${selectedIds.size} recordings` }),
            });
          }}
          onBulkArchive={() => setBulkArchiveOpen(true)}
        />

        {/* Summary */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mic className="h-3.5 w-3.5" />
          <span>{rec.data?.total ?? 0} recordings</span>
        </div>

        {/* Content */}
        {rec.isLoading ? (
          rec.viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-lg" />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          )
        ) : rec.data?.rows.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Mic className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No recordings found. Recordings will appear here once calls are completed.
              </p>
            </CardContent>
          </Card>
        ) : rec.viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rec.data?.rows.map((recording) => (
              <RecordingCard
                key={recording.id}
                recording={recording}
                selected={selectedIds.has(recording.id)}
                onSelect={toggleSelect}
                onPlay={setPlayerRecording}
                onArchive={(id) => setArchiveTarget(id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <RecordingsListView
                recordings={rec.data?.rows ?? []}
                selectedIds={selectedIds}
                onSelect={toggleSelect}
                onSelectAll={selectAll}
                onPlay={setPlayerRecording}
                onArchive={(id) => setArchiveTarget(id)}
              />
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => rec.page > 1 && rec.setParam("page", String(rec.page - 1))}
                  className={rec.page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <PaginationItem key={p}>
                    <PaginationLink
                      isActive={rec.page === p}
                      onClick={() => rec.setParam("page", String(p))}
                      className="cursor-pointer"
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => rec.page < totalPages && rec.setParam("page", String(rec.page + 1))}
                  className={rec.page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {/* Player Modal */}
        <AudioPlayerModal
          recording={playerRecording}
          open={!!playerRecording}
          onOpenChange={(o) => !o && setPlayerRecording(null)}
          allTags={rec.allTags}
          onUpdateTags={(id, tags) => rec.updateTags.mutate({ id, tags })}
          onUpdateNotes={(id, notes) => rec.updateNotes.mutate({ id, notes })}
          onTrackPlayback={(id) => rec.trackPlayback.mutate(id)}
          onArchive={(id) => { setArchiveTarget(id); setPlayerRecording(null); }}
        />

        {/* Archive confirmation */}
        <AlertDialog open={!!archiveTarget} onOpenChange={(o) => !o && setArchiveTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Recording</AlertDialogTitle>
              <AlertDialogDescription>
                This will hide the recording from your library. The data will be preserved for audit purposes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk archive confirmation */}
        <AlertDialog open={bulkArchiveOpen} onOpenChange={setBulkArchiveOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive {selectedIds.size} Recordings</AlertDialogTitle>
              <AlertDialogDescription>
                This will hide the selected recordings from your library.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkArchive}>Archive All</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
