import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const monthlyData = [
  { month: "Jan", production: 28500, target: 28000 },
  { month: "Feb", production: 26200, target: 28000 },
  { month: "Mar", production: 30100, target: 29000 },
  { month: "Apr", production: 32400, target: 30000 },
  { month: "May", production: 31800, target: 31000 },
  { month: "Jun", production: 34200, target: 32000 },
];

const qualityData = [
  { name: "Grade A", value: 78, color: "hsl(38 92% 50%)" },
  { name: "Grade B", value: 18, color: "hsl(24 95% 53%)" },
  { name: "Grade C", value: 4, color: "hsl(30 10% 70%)" },
];

const barnPerformance = [
  { barn: "Barn A", efficiency: 94, trend: "up" },
  { barn: "Barn B", efficiency: 91, trend: "up" },
  { barn: "Barn C", efficiency: 88, trend: "stable" },
  { barn: "Barn D", efficiency: 0, trend: "down" },
];

const Analytics = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">Track your farm performance and trends</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Main Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Production vs Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorProduction" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(38 92% 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(38 92% 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="production"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fill="url(#colorProduction)"
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Secondary Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quality Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quality Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={qualityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {qualityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {qualityData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.name} ({item.value}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Barn Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Barn Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {barnPerformance.map((barn) => (
                  <div key={barn.barn} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{barn.barn}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{barn.efficiency}%</span>
                        {barn.trend === "up" && <TrendingUp className="w-4 h-4 text-green-600" />}
                        {barn.trend === "down" && <TrendingDown className="w-4 h-4 text-destructive" />}
                        {barn.trend === "stable" && <Minus className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${barn.efficiency}%`,
                          background: barn.efficiency > 0 ? "var(--gradient-warm)" : "hsl(var(--muted))",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center p-6">
            <p className="text-4xl font-bold text-primary">183,200</p>
            <p className="text-muted-foreground mt-2">Total Eggs This Quarter</p>
          </Card>
          <Card className="text-center p-6">
            <p className="text-4xl font-bold text-accent">92%</p>
            <p className="text-muted-foreground mt-2">Average Efficiency</p>
          </Card>
          <Card className="text-center p-6">
            <p className="text-4xl font-bold text-foreground">$47,800</p>
            <p className="text-muted-foreground mt-2">Revenue This Quarter</p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
