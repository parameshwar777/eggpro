import { Egg, TrendingUp, Package, AlertTriangle } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const productionData = [
  { day: "Mon", eggs: 1240 },
  { day: "Tue", eggs: 1350 },
  { day: "Wed", eggs: 1280 },
  { day: "Thu", eggs: 1420 },
  { day: "Fri", eggs: 1380 },
  { day: "Sat", eggs: 1520 },
  { day: "Sun", eggs: 1450 },
];

const weeklyData = [
  { week: "W1", production: 8500, sold: 8200 },
  { week: "W2", production: 9200, sold: 8800 },
  { week: "W3", production: 8800, sold: 8500 },
  { week: "W4", production: 9500, sold: 9100 },
];

const recentActivity = [
  { id: 1, action: "Collection completed", location: "Barn A", time: "10 min ago", eggs: 245 },
  { id: 2, action: "Collection completed", location: "Barn B", time: "25 min ago", eggs: 312 },
  { id: 3, action: "Shipment dispatched", location: "Warehouse", time: "1 hour ago", eggs: 2500 },
  { id: 4, action: "Quality check passed", location: "Barn C", time: "2 hours ago", eggs: 180 },
];

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your farm overview.</p>
          </div>
          <Button variant="gradient">
            <Egg className="w-4 h-4 mr-2" />
            Log Collection
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Today's Production"
            value="1,450"
            change="+12.5% from yesterday"
            changeType="positive"
            icon={<Egg className="w-6 h-6" />}
          />
          <StatCard
            title="Weekly Average"
            value="9,240"
            change="+5.2% from last week"
            changeType="positive"
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <StatCard
            title="Stock Available"
            value="24,500"
            change="Ready for shipment"
            changeType="neutral"
            icon={<Package className="w-6 h-6" />}
          />
          <StatCard
            title="Alerts"
            value="2"
            change="Requires attention"
            changeType="negative"
            icon={<AlertTriangle className="w-6 h-6" />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Production Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Daily Production</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={productionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="eggs"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "hsl(var(--accent))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Weekly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="production" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sold" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Egg className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{activity.eggs} eggs</p>
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
