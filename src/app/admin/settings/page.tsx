"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/trpc/react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPass: "",
    fromEmail: "",
    fromName: "",
  });

  const [generalSettings, setGeneralSettings] = useState({
    siteName: "GatherEase",
    allowPublicRegistration: true,
    requireEmailVerification: true,
    maxEventsPerUser: "10",
    maxAttendeesPerEvent: "100",
    defaultTimeZone: "UTC",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    enableEmailNotifications: true,
    sendEventReminders: true,
    reminderHours: "24",
    sendFeedbackRequests: true,
    feedbackRequestDelay: "24",
  });

  // Fetch settings on page load
  const { data: emailData } = api.settings.get.useQuery({ type: "email" });
  const { data: generalData } = api.settings.get.useQuery({ type: "general" });
  const { data: notificationsData } = api.settings.get.useQuery({
    type: "notifications",
  });

  useEffect(() => {
    if (emailData) {
      setEmailSettings(emailData);
    }
  }, [emailData]);

  useEffect(() => {
    if (generalData) {
      setGeneralSettings(generalData);
    }
  }, [generalData]);

  useEffect(() => {
    if (notificationsData) {
      setNotificationSettings(notificationsData);
    }
  }, [notificationsData]);

  const updateSettings = api.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Settings updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEmailSettingsSave = () => {
    updateSettings.mutate({
      type: "email",
      settings: emailSettings,
    });
  };

  const handleGeneralSettingsSave = () => {
    updateSettings.mutate({
      type: "general",
      settings: generalSettings,
    });
  };

  const handleNotificationSettingsSave = () => {
    updateSettings.mutate({
      type: "notifications",
      settings: notificationSettings,
    });
  };

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={generalSettings.siteName}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      siteName: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Public Registration</Label>
                  <p className="text-sm text-gray-500">
                    Allow users to register without an invitation
                  </p>
                </div>
                <Switch
                  checked={generalSettings.allowPublicRegistration}
                  onCheckedChange={(checked) =>
                    setGeneralSettings({
                      ...generalSettings,
                      allowPublicRegistration: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email Verification</Label>
                  <p className="text-sm text-gray-500">
                    Require email verification for new accounts
                  </p>
                </div>
                <Switch
                  checked={generalSettings.requireEmailVerification}
                  onCheckedChange={(checked) =>
                    setGeneralSettings({
                      ...generalSettings,
                      requireEmailVerification: checked,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="maxEvents">Maximum Events per User</Label>
                <Input
                  id="maxEvents"
                  type="number"
                  value={generalSettings.maxEventsPerUser}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      maxEventsPerUser: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="maxAttendees">
                  Maximum Attendees per Event
                </Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  value={generalSettings.maxAttendeesPerEvent}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      maxAttendeesPerEvent: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="timezone">Default Time Zone</Label>
                <Input
                  id="timezone"
                  value={generalSettings.defaultTimeZone}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      defaultTimeZone: e.target.value,
                    })
                  }
                />
              </div>

              <Button onClick={handleGeneralSettingsSave}>Save Changes</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  value={emailSettings.smtpHost}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      smtpHost: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  value={emailSettings.smtpPort}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      smtpPort: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="smtpUser">SMTP Username</Label>
                <Input
                  id="smtpUser"
                  value={emailSettings.smtpUser}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      smtpUser: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="smtpPass">SMTP Password</Label>
                <Input
                  id="smtpPass"
                  type="password"
                  value={emailSettings.smtpPass}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      smtpPass: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={emailSettings.fromEmail}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      fromEmail: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  value={emailSettings.fromName}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      fromName: e.target.value,
                    })
                  }
                />
              </div>

              <Button onClick={handleEmailSettingsSave}>Save Changes</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Enable email notifications for events
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.enableEmailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      enableEmailNotifications: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Event Reminders</Label>
                  <p className="text-sm text-gray-500">
                    Send reminder emails before events
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.sendEventReminders}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      sendEventReminders: checked,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="reminderHours">
                  Reminder Hours Before Event
                </Label>
                <Input
                  id="reminderHours"
                  type="number"
                  value={notificationSettings.reminderHours}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      reminderHours: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Feedback Requests</Label>
                  <p className="text-sm text-gray-500">
                    Send feedback request emails after events
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.sendFeedbackRequests}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      sendFeedbackRequests: checked,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="feedbackDelay">
                  Feedback Request Delay (Hours)
                </Label>
                <Input
                  id="feedbackDelay"
                  type="number"
                  value={notificationSettings.feedbackRequestDelay}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      feedbackRequestDelay: e.target.value,
                    })
                  }
                />
              </div>

              <Button onClick={handleNotificationSettingsSave}>
                Save Changes
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
