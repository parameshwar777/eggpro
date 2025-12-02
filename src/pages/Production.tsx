import { useState } from "react";
import { Plus, Egg, MapPin, Clock, MoreVertical } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const barns = [
  { id: 1, name: "Barn A", hens: 500, todayCollection: 420, avgDaily: 405, status: "active" },
  { id: 2, name: "Barn B", hens: 650, todayCollection: 545, avgDaily: 530, status: "active" },
  { id: 3, name: "Barn C", hens: 300, todayCollection: 248, avgDaily: 240, status: "active" },
  { id: 4, name: "Barn D", hens: 450, todayCollection: 0, avgDaily: 375, status: "maintenance" },
];

const collections = [
  { id: 1, barn: "Barn A", eggs: 245, time: "06:30 AM", quality: "Grade A" },
  { id: 2, barn: "Barn B", eggs: 312, time: "07:15 AM", quality: "Grade A" },
  { id: 3, barn: "Barn A", eggs: 175, time: "12:00 PM", quality: "Grade A" },
  { id: 4, barn: "Barn B", eggs: 233, time: "12:45 PM", quality: "Grade A" },
  { id: 5, barn: "Barn C", eggs: 248, time: "01:30 PM", quality: "Grade A" },
];

const Production = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleNewCollection = () => {
    toast({
      title: "Log Collection",
      description: "Collection logging form would open here.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Production</h1>
            <p className="text-muted-foreground mt-1">Manage your egg collection and barns</p>
          </div>
          <Button variant="gradient" onClick={handleNewCollection}>
            <Plus className="w-4 h-4 mr-2" />
            Log Collection
          </Button>
        </div>

        {/* Barns Overview */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Barns Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {barns.map((barn) => (
              <Card 
                key={barn.id} 
                className={barn.status === "maintenance" ? "opacity-60" : "hover:shadow-elevated transition-all duration-300"}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Barn</DropdownMenuItem>
                        <DropdownMenuItem>Set Maintenance</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{barn.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{barn.hens} hens</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Today</span>
                      <span className="font-semibold text-foreground">{barn.todayCollection} eggs</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Daily Avg</span>
                      <span className="text-muted-foreground">{barn.avgDaily} eggs</span>
                    </div>
                  </div>
                  
                  {barn.status === "maintenance" && (
                    <div className="mt-4 px-3 py-1.5 bg-destructive/10 text-destructive text-xs font-medium rounded-full text-center">
                      Under Maintenance
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Today's Collections */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Today's Collections</CardTitle>
            <Input
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Barn</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Eggs</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Time</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Quality</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {collections
                    .filter((c) => c.barn.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((collection) => (
                      <tr key={collection.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Egg className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium text-foreground">{collection.barn}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-foreground">{collection.eggs}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {collection.time}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            {collection.quality}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button variant="ghost" size="sm">View</Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Production;
