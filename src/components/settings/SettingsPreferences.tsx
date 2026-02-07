import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SlidersHorizontal, Save, Moon, Sun, Monitor } from "lucide-react";
import { toast } from "sonner";

interface Preferences {
  dateRange: string;
  refreshInterval: string;
  rowsPerPage: string;
  defaultSort: string;
  theme: string;
}

const STORAGE_KEY = "client-preferences";

function loadPreferences(): Preferences {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { dateRange: "7d", refreshInterval: "off", rowsPerPage: "25", defaultSort: "newest", theme: "system" };
}

export default function SettingsPreferences() {
  const [prefs, setPrefs] = useState<Preferences>(loadPreferences);

  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    setPrefs((p) => ({ ...p, [key]: value }));

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));

    // Apply theme
    if (prefs.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (prefs.theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }

    toast.success("Preferences saved");
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="h-4 w-4" /> Dashboard Defaults
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Default Date Range</Label>
              <Select value={prefs.dateRange} onValueChange={(v) => update("dateRange", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="90d">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Auto-Refresh Interval</Label>
              <Select value={prefs.refreshInterval} onValueChange={(v) => update("refreshInterval", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Off</SelectItem>
                  <SelectItem value="30s">30 Seconds</SelectItem>
                  <SelectItem value="1m">1 Minute</SelectItem>
                  <SelectItem value="5m">5 Minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call Logs Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Call Logs Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Rows Per Page</Label>
              <Select value={prefs.rowsPerPage} onValueChange={(v) => update("rowsPerPage", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Default Sort</Label>
              <Select value={prefs.defaultSort} onValueChange={(v) => update("defaultSort", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="duration">Longest Duration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={prefs.theme} onValueChange={(v) => update("theme", v)} className="flex gap-4">
            {[
              { value: "light", label: "Light", icon: Sun },
              { value: "dark", label: "Dark", icon: Moon },
              { value: "system", label: "System", icon: Monitor },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors ${
                  prefs.theme === opt.value ? "border-primary bg-accent" : "border-border hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value={opt.value} className="sr-only" />
                <opt.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{opt.label}</span>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} className="gap-2">
          <Save className="h-4 w-4" /> Save Preferences
        </Button>
      </div>
    </div>
  );
}
