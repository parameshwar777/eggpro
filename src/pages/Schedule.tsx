import { useState } from "react";
import { Plus, Clock, MapPin, CheckCircle2, Circle } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const scheduleItems = [
  { id: 1, time: "06:00", task: "Morning Collection - Barn A", status: "completed", assignee: "John" },
  { id: 2, time: "06:30", task: "Morning Collection - Barn B", status: "completed", assignee: "Sarah" },
  { id: 3, time: "07:00", task: "Feed Distribution - All Barns", status: "completed", assignee: "Mike" },
  { id: 4, time: "09:00", task: "Health Check - Barn C", status: "in-progress", assignee: "Dr. Smith" },
  { id: 5, time: "12:00", task: "Midday Collection - All Barns", status: "pending", assignee: "Team" },
  { id: 6, time: "15:00", task: "Egg Sorting & Grading", status: "pending", assignee: "Warehouse" },
  { id: 7, time: "17:00", task: "Evening Collection - All Barns", status: "pending", assignee: "Team" },
  { id: 8, time: "18:00", task: "Daily Report Generation", status: "pending", assignee: "System" },
];

const upcomingShipments = [
  { id: 1, customer: "Fresh Market Co.", eggs: 5000, date: "Today, 2:00 PM" },
  { id: 2, customer: "Green Grocers Ltd.", eggs: 3500, date: "Tomorrow, 9:00 AM" },
  { id: 3, customer: "Local Bakery", eggs: 1200, date: "Dec 4, 10:00 AM" },
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const currentDay = 1; // Tuesday

const Schedule = () => {
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const { toast } = useToast();

  const handleAddTask = () => {
    toast({
      title: "Add Task",
      description: "Task creation form would open here.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "in-progress":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "in-progress":
        return <Circle className="w-5 h-5 text-primary fill-primary/20" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Schedule</h1>
            <p className="text-muted-foreground mt-1">Manage your daily tasks and shipments</p>
          </div>
          <Button variant="gradient" onClick={handleAddTask}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Week Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              {weekDays.map((day, index) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(index)}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-xl transition-all duration-200 min-w-[60px]",
                    selectedDay === index
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "hover:bg-secondary text-muted-foreground"
                  )}
                >
                  <span className="text-xs font-medium">{day}</span>
                  <span className="text-lg font-bold mt-1">{index + 2}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Schedule */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Today's Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduleItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl transition-all duration-200",
                      item.status === "completed" ? "bg-secondary/30" : "bg-secondary/50 hover:bg-secondary"
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">{item.time}</span>
                      </div>
                      <p className={cn(
                        "font-medium",
                        item.status === "completed" ? "text-muted-foreground line-through" : "text-foreground"
                      )}>
                        {item.task}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Assigned to: {item.assignee}
                      </p>
                    </div>
                    <span className={cn(
                      "text-xs font-medium capitalize px-3 py-1 rounded-full",
                      item.status === "completed" && "bg-green-100 text-green-700",
                      item.status === "in-progress" && "bg-primary/10 text-primary",
                      item.status === "pending" && "bg-secondary text-muted-foreground"
                    )}>
                      {item.status.replace("-", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Shipments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Upcoming Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingShipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-foreground">{shipment.customer}</h4>
                      <span className="text-lg font-bold text-primary">{shipment.eggs.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {shipment.date}
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Shipments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Schedule;
