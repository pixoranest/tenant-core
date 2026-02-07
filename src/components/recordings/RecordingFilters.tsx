import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, ChevronDown, X } from "lucide-react";
import { useState, useEffect } from "react";

interface Props {
  search: string;
  dateFilter: string;
  sortBy: string;
  outcomeFilter: string;
  hasRecording: boolean;
  hasTranscript: boolean;
  hasTagged: boolean;
  hasNotes: boolean;
  minDuration: number;
  maxDuration: number;
  activeFilterCount: number;
  setParam: (key: string, value: string) => void;
  clearFilters: () => void;
}

export default function RecordingFilters(props: Props) {
  const [localSearch, setLocalSearch] = useState(props.search);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => props.setParam("q", localSearch), 300);
    return () => clearTimeout(t);
  }, [localSearch]);

  useEffect(() => setLocalSearch(props.search), [props.search]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search recordings…"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={props.dateFilter} onValueChange={(v) => props.setParam("date", v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
        <Select value={props.sortBy} onValueChange={(v) => props.setParam("sort", v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="longest">Longest</SelectItem>
            <SelectItem value="shortest">Shortest</SelectItem>
            <SelectItem value="most-played">Most Played</SelectItem>
          </SelectContent>
        </Select>
        {props.activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={props.clearFilters} className="gap-1 text-muted-foreground">
            <X className="h-3 w-3" /> Reset
          </Button>
        )}
      </div>

      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <Filter className="h-3 w-3" />
            Filters
            {props.activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{props.activeFilterCount}</Badge>
            )}
            <ChevronDown className={`h-3 w-3 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Duration slider */}
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">
                Duration: {props.minDuration}s – {props.maxDuration > 0 ? `${props.maxDuration}s` : "any"}
              </label>
              <Slider
                min={0}
                max={600}
                step={10}
                value={[props.minDuration, props.maxDuration || 600]}
                onValueChange={([min, max]) => {
                  props.setParam("minDur", String(min));
                  props.setParam("maxDur", max >= 600 ? "0" : String(max));
                }}
                className="mt-2"
              />
            </div>

            {/* Status checkboxes */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Content</label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={props.hasRecording} onCheckedChange={(c) => props.setParam("hasRec", c ? "1" : "")} />
                  Has Recording
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={props.hasTranscript} onCheckedChange={(c) => props.setParam("hasTr", c ? "1" : "")} />
                  Has Transcript
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={props.hasTagged} onCheckedChange={(c) => props.setParam("tagged", c ? "1" : "")} />
                  Tagged
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={props.hasNotes} onCheckedChange={(c) => props.setParam("hasNotes", c ? "1" : "")} />
                  With Notes
                </label>
              </div>
            </div>

            {/* Outcome filter */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Outcome</label>
              <Select value={props.outcomeFilter} onValueChange={(v) => props.setParam("outcome", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="appointment_booked">Appointment Booked</SelectItem>
                  <SelectItem value="information_provided">Information Provided</SelectItem>
                  <SelectItem value="callback_requested">Callback Requested</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
