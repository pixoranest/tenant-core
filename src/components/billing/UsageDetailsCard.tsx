import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PLAN_LABEL } from "@/types/client";

interface UsageDetailsCardProps {
  dailyData: Array<{ date: string; minutes: number; cost: number }>;
  overview: {
    billingPlan: string;
    ratePerMin: number;
    allowance: number;
    totalMinutes: number;
    overageMinutes: number;
    overageCost: number;
    baseCost: number;
    totalCost: number;
    agentBreakdown: Array<{
      agentId: string;
      calls: number;
      minutes: number;
      cost: number;
    }>;
  };
}

const COLORS = [
  "hsl(174, 62%, 38%)",
  "hsl(210, 80%, 55%)",
  "hsl(270, 55%, 55%)",
  "hsl(152, 60%, 42%)",
  "hsl(30, 80%, 55%)",
];

export default function UsageDetailsCard({ dailyData, overview }: UsageDetailsCardProps) {
  const taxRate = 0.18;
  const taxAmount = Math.round(overview.totalCost * taxRate * 100) / 100;
  const grandTotal = Math.round((overview.totalCost + taxAmount) * 100) / 100;
  const projectedDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysPassed = new Date().getDate();
  const projectedCost = daysPassed > 0
    ? Math.round((overview.totalCost / daysPassed) * projectedDays * 100) / 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Usage Details</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="breakdown">Usage Breakdown</TabsTrigger>
            <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="minutes"
                    stroke="hsl(174, 62%, 38%)"
                    fill="hsl(174, 62%, 38%)"
                    fillOpacity={0.15}
                    name="Minutes"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly summary */}
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-lg border border-border p-3">
                <p className="text-muted-foreground">Plan</p>
                <p className="font-medium">{PLAN_LABEL[overview.billingPlan] ?? overview.billingPlan}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-muted-foreground">Rate / min</p>
                <p className="font-medium">₹{overview.ratePerMin}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-muted-foreground">Included Minutes</p>
                <p className="font-medium">{overview.allowance.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-muted-foreground">Used Minutes</p>
                <p className="font-medium">{overview.totalMinutes.toLocaleString()}</p>
              </div>
              {overview.overageMinutes > 0 && (
                <>
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-muted-foreground">Overage Minutes</p>
                    <p className="font-medium text-destructive">{overview.overageMinutes}</p>
                  </div>
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-muted-foreground">Overage Cost</p>
                    <p className="font-medium text-destructive">₹{overview.overageCost}</p>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Calls</TableHead>
                  <TableHead className="text-right">Minutes</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.agentBreakdown.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No usage data available
                    </TableCell>
                  </TableRow>
                ) : (
                  overview.agentBreakdown.map((a, i) => (
                    <TableRow key={a.agentId}>
                      <TableCell className="font-medium">
                        Agent {i + 1}
                      </TableCell>
                      <TableCell className="text-right">{a.calls}</TableCell>
                      <TableCell className="text-right">{a.minutes}</TableCell>
                      <TableCell className="text-right">₹{Math.round(a.cost * 100) / 100}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {overview.agentBreakdown.length > 0 && (
              <div className="h-52 mx-auto max-w-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overview.agentBreakdown.map((a, i) => ({
                        name: `Agent ${i + 1}`,
                        value: a.minutes,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {overview.agentBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cost" className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Base Charges</p>
                <p className="text-2xl font-bold">₹{overview.baseCost}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Overage Charges</p>
                <p className="text-2xl font-bold text-destructive">₹{overview.overageCost}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">Taxes (18% GST)</p>
                <p className="text-2xl font-bold">₹{taxAmount}</p>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-primary">₹{grandTotal}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">📊 Projection</p>
              <p className="mt-1 text-lg font-semibold">
                Estimated month-end cost at current usage:{" "}
                <span className="text-primary">₹{projectedCost.toLocaleString()}</span>
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
