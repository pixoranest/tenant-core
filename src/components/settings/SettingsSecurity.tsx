import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Shield, Lock, Smartphone, Monitor } from "lucide-react";
import { toast } from "sonner";

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;

  if (score >= 80) return { score, label: "Strong", color: "bg-green-500" };
  if (score >= 50) return { score, label: "Medium", color: "bg-yellow-500" };
  return { score, label: "Weak", color: "bg-red-500" };
}

export default function SettingsSecurity() {
  const { updatePassword } = useAuth();
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [saving, setSaving] = useState(false);

  const strength = getPasswordStrength(newPass);

  const handleChangePassword = async () => {
    if (newPass.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await updatePassword(newPass);
      toast.success("Password updated successfully");
      setNewPass("");
      setConfirmPass("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">New Password</Label>
            <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Enter new password" />
            {newPass && (
              <div className="space-y-1 pt-1">
                <Progress value={strength.score} className={`h-1.5 [&>div]:${strength.color}`} />
                <p className="text-xs text-muted-foreground">Strength: {strength.label}</p>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Confirm Password</Label>
            <Input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Confirm new password" />
          </div>
          <Button onClick={handleChangePassword} disabled={saving || !newPass || !confirmPass}>
            {saving ? "Updating…" : "Update Password"}
          </Button>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-4 w-4" /> Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Enable 2FA</p>
              <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
            </div>
            <Switch disabled onCheckedChange={() => toast.info("2FA setup coming soon")} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground italic">Two-factor authentication will be available in a future update.</p>
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="h-4 w-4" /> Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Monitor className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Current Session</p>
              <p className="text-xs text-muted-foreground">This browser · Active now</p>
            </div>
            <span className="h-2 w-2 rounded-full bg-green-500" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground italic">Session management will show all active devices in a future update.</p>
        </CardContent>
      </Card>
    </div>
  );
}
