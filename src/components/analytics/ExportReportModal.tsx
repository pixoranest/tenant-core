import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  rangeLabel: string;
}

export default function ExportReportModal({ open, onClose, rangeLabel }: Props) {
  const [format, setFormat] = useState("pdf");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeTables, setIncludeTables] = useState(true);
  const [includeInsights, setIncludeInsights] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleGenerate = () => {
    setGenerating(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setGenerating(false);
          toast.success("Report generated successfully!", { description: `${rangeLabel} analytics report (${format.toUpperCase()})` });
          onClose();
          return 100;
        }
        return p + Math.random() * 25;
      });
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generate Analytics Report
          </DialogTitle>
          <DialogDescription>Create a downloadable report for: {rangeLabel}</DialogDescription>
        </DialogHeader>

        {generating ? (
          <div className="space-y-4 py-6">
            <p className="text-sm text-muted-foreground text-center">Generating report…</p>
            <Progress value={Math.min(progress, 100)} className="h-2" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Format</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="pptx">PowerPoint</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Include</label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={includeCharts} onCheckedChange={(v) => setIncludeCharts(!!v)} /> Charts
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={includeTables} onCheckedChange={(v) => setIncludeTables(!!v)} /> Data Tables
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={includeInsights} onCheckedChange={(v) => setIncludeInsights(!!v)} /> Insights
              </label>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={generating}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={generating} className="gap-2">
            <Download className="h-4 w-4" /> Generate Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
