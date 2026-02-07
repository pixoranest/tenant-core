import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOutcomeDistribution, useAppointmentsCount, type AnalyticsRange } from "@/hooks/useAnalyticsData";
import { CalendarCheck, UserCheck, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useNavigate } from "react-router-dom";

const OUTCOME_COLORS: Record<string, string> = {
  appointment_booked: "hsl(152,60%,42%)",
  information_provided: "hsl(210,80%,55%)",
  callback_requested: "hsl(45,90%,55%)",
  no_answer: "hsl(30,90%,55%)",
  other: "hsl(200,10%,55%)",
};

function getColor(name: string) {
  return OUTCOME_COLORS[name] ?? OUTCOME_COLORS.other;
}

export default function OutcomeAnalysis({ range }: { range: AnalyticsRange }) {
  const { data: outcomeData, isLoading: oLoading } = useOutcomeDistribution(range);
  const { data: apptData, isLoading: aLoading } = useAppointmentsCount(range);
  const navigate = useNavigate();

  const isLoading = oLoading || aLoading;

  if (isLoading) return <Skeleton className="h-[340px] w-full rounded-xl" />;

  const outcomes = outcomeData?.outcomes ?? [];

  return (
    <div className="space-y-6">
      {/* Outcome Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Outcome Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(200, outcomes.length * 40 + 40)}>
            <BarChart data={outcomes} layout="vertical">
              <XAxis type="number" tick={{ fill: "hsl(200,10%,45%)", fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "hsl(200,10%,45%)", fontSize: 11 }} width={140}
                tickFormatter={(v: string) => v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(210,18%,10%)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12 }}
                formatter={(val: number, _: any, entry: any) => [`${val} (${entry.payload.pct}%)`, "Calls"]}
              />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onClick={(entry: any) => {
                  navigate(`/dashboard/call-logs?outcome=${entry.name}`);
                }}
              >
                {outcomes.map((o) => (
                  <Cell key={o.name} fill={getColor(o.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Business Impact Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => navigate("/dashboard/appointments")}>
          <CardContent className="flex items-start gap-4 p-5">
            <div className="rounded-lg bg-emerald-500/10 p-2.5">
              <CalendarCheck className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Appointments Booked</p>
              <p className="text-2xl font-bold text-foreground">{apptData?.count ?? 0}</p>
              <p className="text-xs text-muted-foreground">Conversion: {apptData?.conversionRate ?? 0}%</p>
              <p className="mt-1 text-xs font-medium text-primary">View Appointments →</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-4 p-5">
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <UserCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Leads Captured</p>
              <p className="text-2xl font-bold text-foreground">{outcomeData?.leadsCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Contact info captured</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-4 p-5">
            <div className="rounded-lg bg-amber-500/10 p-2.5">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Est. Revenue Impact</p>
              <p className="text-2xl font-bold text-foreground">
                ${((apptData?.count ?? 0) * 150).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground" title="Estimated value – configurable later">
                Simulated estimate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
