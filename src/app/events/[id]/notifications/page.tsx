"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  Mail,
  RefreshCw,
  Send,
  Users,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function EventNotificationsPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("send");
  const [notificationType, setNotificationType] = useState("update");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Get event details
  const { data: event, isLoading: isLoadingEvent } = api.event.getById.useQuery(
    { id: eventId },
    { enabled: !!eventId },
  );

  // Get attendees count
  const { data: attendeesData } = api.attendee.getByEvent.useQuery(
    { eventId },
    { enabled: !!eventId },
  );

  // Get notification history
  const {
    data: notificationsData,
    isLoading: isLoadingNotifications,
    refetch: refetchNotifications,
  } = api.notification.getByEvent.useQuery({ eventId }, { enabled: !!eventId });

  // Send notification mutation
  const sendNotificationMutation =
    api.notification.sendToEventAttendees.useMutation({
      onSuccess: (data) => {
        toast({
          title: "Notification Sent",
          description: `Successfully sent to ${data.successCount} of ${data.totalRecipients} attendees.`,
        });

        // Reset form
        setSubject("");
        setMessage("");

        // Refresh notification history
        refetchNotifications();

        // Switch to history tab
        setActiveTab("history");
      },
      onError: (error) => {
        toast({
          title: "Failed to Send Notification",
          description: error.message,
          variant: "destructive",
        });
      },
    });

  // Handle form submission
  const handleSendNotification = () => {
    if (!subject.trim()) {
      toast({
        title: "Subject Required",
        description: "Please enter a subject for your notification.",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message for your notification.",
        variant: "destructive",
      });
      return;
    }

    // Confirm before sending
    if (
      window.confirm(
        `Are you sure you want to send this notification to all attendees?`,
      )
    ) {
      sendNotificationMutation.mutate({
        eventId,
        subject,
        message,
        type: notificationType as any,
      });
    }
  };

  // Get notification type label
  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "update":
        return "Update";
      case "cancellation":
        return "Cancellation";
      case "reminder":
        return "Reminder";
      default:
        return type;
    }
  };

  // Get notification type icon
  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case "update":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "cancellation":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "reminder":
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="container mx-auto flex justify-center py-8">
        <LoadingSpinner size="lg" text="Loading event details..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Event Not Found</CardTitle>
            <CardDescription>
              The event you are looking for could not be found.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">{event.name}</h1>
            <p className="text-muted-foreground">
              {format(new Date(event.startDate), "PPP")} at{" "}
              {format(new Date(event.startDate), "p")}
            </p>
          </div>
          <Link href={`/events/${eventId}`}>
            <Button variant="outline">Back to Event</Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send">
            <Send className="mr-2 h-4 w-4" />
            Send Notifications
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="mr-2 h-4 w-4" />
            Notification History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Notification to Attendees</CardTitle>
              <CardDescription>
                Send an email notification to all registered attendees for this
                event.
                {attendeesData && (
                  <div className="mt-2 flex items-center text-sm">
                    <Users className="mr-1 h-4 w-4" />
                    <span>
                      {attendeesData.length}{" "}
                      {attendeesData.length === 1 ? "attendee" : "attendees"}{" "}
                      will receive this notification
                    </span>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Notification Type</Label>
                <RadioGroup
                  value={notificationType}
                  onValueChange={setNotificationType}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="update" id="update" />
                    <Label htmlFor="update" className="flex items-center">
                      <Info className="mr-2 h-4 w-4 text-blue-500" />
                      Event Update
                      <span className="ml-2 text-xs text-muted-foreground">
                        (General information or updates about the event)
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="reminder" id="reminder" />
                    <Label htmlFor="reminder" className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-amber-500" />
                      Event Reminder
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Remind attendees about the upcoming event)
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cancellation" id="cancellation" />
                    <Label htmlFor="cancellation" className="flex items-center">
                      <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                      Event Cancellation
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Notify attendees that the event is cancelled)
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Enter email subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your message to attendees"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                />
              </div>

              <Button
                onClick={handleSendNotification}
                disabled={
                  sendNotificationMutation.isPending ||
                  !subject.trim() ||
                  !message.trim()
                }
                className="w-full"
              >
                {sendNotificationMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Notification
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 py-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notification History</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRefreshKey((prev) => prev + 1);
                    refetchNotifications();
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
              <CardDescription>
                View all notifications sent to attendees for this event.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingNotifications ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner
                    size="lg"
                    text="Loading notification history..."
                  />
                </div>
              ) : notificationsData?.items &&
                notificationsData.items.length > 0 ? (
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Sent
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Recipients
                        </TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {notificationsData.items.map((notification) => (
                        <TableRow key={notification.id}>
                          <TableCell>
                            <div className="flex items-center">
                              {getNotificationTypeIcon(notification.type)}
                              <span className="ml-2 hidden md:inline">
                                {getNotificationTypeLabel(notification.type)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {notification.subject}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {notification.sentAt
                              ? format(
                                  new Date(notification.sentAt),
                                  "MMM d, yyyy 'at' h:mm a",
                                )
                              : "N/A"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {notification.recipientCount || 0}
                          </TableCell>
                          <TableCell className="text-right">
                            {notification.successCount ===
                            notification.recipientCount ? (
                              <div className="flex items-center justify-end">
                                <CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
                                <span className="text-sm">Sent</span>
                              </div>
                            ) : notification.successCount === 0 ? (
                              <div className="flex items-center justify-end">
                                <XCircle className="mr-1 h-4 w-4 text-red-500" />
                                <span className="text-sm">Failed</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end">
                                <AlertCircle className="mr-1 h-4 w-4 text-amber-500" />
                                <span className="text-sm">
                                  {notification.successCount}/
                                  {notification.recipientCount}
                                </span>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No notifications have been sent for this event yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
