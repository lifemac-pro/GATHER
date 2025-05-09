"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, Bell, Shield } from "lucide-react";

export default function AttendeeSettingsPage() {
  const { user, isLoaded } = useUser();
  const { client } = useClerk();
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  // Fetch user preferences
  const { data: preferences, isLoading: isPreferencesLoading } = 
    api.attendee.getPreferences.useQuery(
      undefined,
      { enabled: isLoaded && !!user }
    );

  const updatePreferences = api.attendee.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Preferences updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update preferences: ${error.message}`);
    },
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    eventReminders: true,
    surveyReminders: true,
    marketingEmails: false,
  });

  // Update notification settings when preferences are loaded
  useEffect(() => {
    if (preferences && !isPreferencesLoading) {
      setNotificationSettings({
        emailNotifications: preferences.emailNotifications,
        eventReminders: preferences.eventReminders,
        surveyReminders: preferences.surveyReminders,
        marketingEmails: preferences.marketingEmails,
      });
    }
  }, [preferences, isPreferencesLoading]);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || ''
      });
    }
  }, [user]);

  const isLoading = !isLoaded || isPreferencesLoading;

  if (isLoading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  const handleToggleChange = (key: keyof typeof notificationSettings) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key],
    };
    setNotificationSettings(newSettings);
    updatePreferences.mutate(newSettings);
  };

  const handleUpdateProfile = async () => {
    try {
      setIsUpdating(true);
      await user?.update({
        firstName: profileData.firstName,
        lastName: profileData.lastName
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container space-y-8 py-8">
      <h1 className="text-3xl font-bold text-foreground">Settings</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      firstName: e.target.value
                    }))}
                    placeholder="Enter your first name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      lastName: e.target.value
                    }))}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email changes require additional verification. Please contact support if you need to update your email.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleUpdateProfile}
                disabled={isUpdating}
                className="bg-[#00b0a6] text-white hover:bg-[#00b0a6]/90"
              >
                {isUpdating ? "Updating..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={() => handleToggleChange('emailNotifications')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="event-reminders">Event Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders before your events
                  </p>
                </div>
                <Switch
                  id="event-reminders"
                  checked={notificationSettings.eventReminders}
                  onCheckedChange={() => handleToggleChange('eventReminders')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="survey-reminders">Survey Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders to complete event surveys
                  </p>
                </div>
                <Switch
                  id="survey-reminders"
                  checked={notificationSettings.surveyReminders}
                  onCheckedChange={() => handleToggleChange('surveyReminders')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing-emails">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive promotional emails about new events
                  </p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={notificationSettings.marketingEmails}
                  onCheckedChange={() => handleToggleChange('marketingEmails')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Manage your privacy preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your privacy is important to us. We only use your information to provide you with the best event experience.
              </p>
              
              <div className="rounded-lg bg-muted p-4">
                <h3 className="mb-2 font-medium">Data Usage</h3>
                <p className="text-sm text-muted-foreground">
                  We collect and process your data according to our privacy policy. This includes your name, email, and event participation history.
                </p>
              </div>
              
              <div className="rounded-lg bg-muted p-4">
                <h3 className="mb-2 font-medium">Data Deletion</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You can request deletion of your account and associated data at any time.
                </p>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    toast.info("Please contact support to delete your account");
                  }}
                >
                  Request Account Deletion
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
