import { useState } from "react";
import { User, Bell, Shield, Database, Save } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const settingsTabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "data", label: "Data & Export", icon: Database },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [dailyReports, setDailyReports] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your changes have been saved successfully.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Navigation */}
          <Card className="lg:col-span-1 h-fit">
            <CardContent className="p-4">
              <nav className="space-y-2">
                {settingsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left",
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>

          {/* Settings Content */}
          <div className="lg:col-span-3 space-y-6">
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details and farm information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-10 h-10 text-primary" />
                    </div>
                    <Button variant="outline">Change Photo</Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Full Name</label>
                      <Input defaultValue="John Farmer" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Email</label>
                      <Input defaultValue="john@eggfarm.com" type="email" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Farm Name</label>
                      <Input defaultValue="Sunny Side Farm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Phone</label>
                      <Input defaultValue="+1 (555) 123-4567" type="tel" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Farm Address</label>
                    <Input defaultValue="123 Country Road, Farmville, CA 90210" />
                  </div>

                  <Button variant="gradient" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                    <div>
                      <p className="font-medium text-foreground">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                    <div>
                      <p className="font-medium text-foreground">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
                    </div>
                    <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                    <div>
                      <p className="font-medium text-foreground">Daily Reports</p>
                      <p className="text-sm text-muted-foreground">Get a daily summary of your farm activity</p>
                    </div>
                    <Switch checked={dailyReports} onCheckedChange={setDailyReports} />
                  </div>

                  <Button variant="gradient" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Current Password</label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">New Password</label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                  </div>

                  <Button variant="gradient" onClick={handleSave}>
                    <Shield className="w-4 h-4 mr-2" />
                    Update Password
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === "data" && (
              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Export and manage your farm data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-xl bg-secondary/50">
                    <h4 className="font-medium text-foreground mb-2">Export Production Data</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Download all your egg production records as a CSV file
                    </p>
                    <Button variant="outline">Export to CSV</Button>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary/50">
                    <h4 className="font-medium text-foreground mb-2">Export Analytics Report</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Download a detailed PDF report of your farm analytics
                    </p>
                    <Button variant="outline">Generate Report</Button>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-destructive/20 bg-destructive/5">
                    <h4 className="font-medium text-destructive mb-2">Delete Account</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently delete your account and all associated data
                    </p>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
