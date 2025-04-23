"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { QRCodeGenerator } from "@/components/events/qr-code-generator";
import { QRCodeScanner } from "@/components/events/qr-code-scanner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  UserCheck,
  QrCode,
  Ticket,
} from "lucide-react";
import { format } from "date-fns";

export default function EventCheckInPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("scanner");
  const [searchTerm, setSearchTerm] = useState("");
  const [ticketCode, setTicketCode] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Get event details
  const { data: event, isLoading: isLoadingEvent } = api.event.getById.useQuery(
    { id: eventId },
    { enabled: !!eventId },
  );

  // Get attendees for this event
  const {
    data: attendeesData,
    isLoading: isLoadingAttendees,
    refetch: refetchAttendees,
  } = api.attendee.getByEvent.useQuery(
    { eventId },
    { enabled: !!eventId, refetchInterval: 30000 }, // Refetch every 30 seconds
  );

  // Get check-in stats
  const { data: checkInStats, refetch: refetchStats } =
    api.attendee.getCheckInStats.useQuery(
      { eventId },
      { enabled: !!eventId, refetchInterval: 30000 }, // Refetch every 30 seconds
    );

  // Manual check-in mutation
  const checkInMutation = api.attendee.checkIn.useMutation({
    onSuccess: () => {
      toast({
        title: "Check-in Successful",
        description: "Attendee has been checked in.",
      });
      refetchAttendees();
      refetchStats();
      setTicketCode("");
    },
    onError: (error) => {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Process QR code mutation
  const processQrCodeMutation = api.attendee.processQrCode.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "QR Code Processed",
          description: data.message,
        });

        // If it's an attendee QR code, refresh the attendee list
        if (data.data.type === "attendee") {
          refetchAttendees();
          refetchStats();
        }
      } else {
        toast({
          title: "QR Code Processing Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "QR Code Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle QR code scan success
  const handleScanSuccess = (data: any) => {
    // Process the QR code data
    processQrCodeMutation.mutate({
      qrData: typeof data === "string" ? data : JSON.stringify(data),
      eventId,
    });
  };

  // Handle manual check-in by ticket code
  const handleManualCheckIn = () => {
    if (!ticketCode) {
      toast({
        title: "Error",
        description: "Please enter a ticket code",
        variant: "destructive",
      });
      return;
    }

    // Find attendee with this ticket code
    const attendee = attendeesData?.find((a) => a.ticketCode === ticketCode);
    if (!attendee) {
      toast({
        title: "Error",
        description: "No attendee found with this ticket code",
        variant: "destructive",
      });
      return;
    }

    // Check in the attendee
    checkInMutation.mutate({
      attendeeId: attendee.id,
      eventId,
      ticketId: ticketCode,
    });
  };

  // Filter attendees based on search term
  const filteredAttendees = attendeesData?.filter((attendee) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      attendee.name?.toLowerCase().includes(searchLower) ||
      attendee.email?.toLowerCase().includes(searchLower) ||
      attendee.ticketCode?.toLowerCase().includes(searchLower)
    );
  });

  // Refresh data
  const refreshData = () => {
    setRefreshKey((prev) => prev + 1);
    refetchAttendees();
    refetchStats();
    toast({
      title: "Refreshing Data",
      description: "Getting the latest attendee information...",
    });
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
        <h1 className="mb-2 text-3xl font-bold">{event.name}</h1>
        <p className="text-muted-foreground">
          {format(new Date(event.startDate), "PPP")} at{" "}
          {format(new Date(event.startDate), "p")}
        </p>
      </div>

      {/* Check-in Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Attendees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Ticket className="mr-2 h-8 w-8 text-primary" />
              <span className="text-3xl font-bold">
                {checkInStats?.totalAttendees || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Checked In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <UserCheck className="mr-2 h-8 w-8 text-green-500" />
              <span className="text-3xl font-bold">
                {checkInStats?.checkedInAttendees || 0}
              </span>
              <span className="ml-2 text-muted-foreground">
                ({checkInStats?.checkedInPercentage || 0}%)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Check-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="mr-2 h-8 w-8 text-blue-500" />
              <span className="text-3xl font-bold">
                {checkInStats?.recentCheckIns || 0}
              </span>
              <span className="ml-2 text-muted-foreground">(last 24h)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Column - QR Code Tools */}
        <div className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scanner">
                <QrCode className="mr-2 h-4 w-4" />
                Scanner
              </TabsTrigger>
              <TabsTrigger value="generator">
                <QrCode className="mr-2 h-4 w-4" />
                Generator
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Ticket className="mr-2 h-4 w-4" />
                Manual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scanner" className="mt-4">
              <QRCodeScanner
                eventId={eventId}
                onScanSuccess={handleScanSuccess}
              />
            </TabsContent>

            <TabsContent value="generator" className="mt-4">
              <QRCodeGenerator eventId={eventId} eventName={event.name} />
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Manual Check-in</CardTitle>
                  <CardDescription>
                    Enter a ticket code to check in an attendee
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticket-code">Ticket Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="ticket-code"
                        placeholder="Enter ticket code"
                        value={ticketCode}
                        onChange={(e) => setTicketCode(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleManualCheckIn()
                        }
                      />
                      <Button
                        onClick={handleManualCheckIn}
                        disabled={checkInMutation.isPending || !ticketCode}
                      >
                        {checkInMutation.isPending ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <UserCheck className="mr-2 h-4 w-4" />
                        )}
                        Check In
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Attendee List */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Attendees</CardTitle>
                <Button variant="outline" size="sm" onClick={refreshData}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
              <CardDescription>
                {isLoadingAttendees
                  ? "Loading attendees..."
                  : `${attendeesData?.length || 0} registered attendees`}
              </CardDescription>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search attendees..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAttendees ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" text="Loading attendees..." />
                </div>
              ) : filteredAttendees && filteredAttendees.length > 0 ? (
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Status</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Email
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Ticket
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAttendees.map((attendee) => (
                        <TableRow key={attendee.id}>
                          <TableCell>
                            {attendee.status === "checked-in" ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : attendee.status === "cancelled" ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-amber-500" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {attendee.name}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {attendee.email}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {attendee.ticketCode}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                checkInMutation.mutate({
                                  attendeeId: attendee.id,
                                  eventId,
                                });
                              }}
                              disabled={
                                attendee.status === "checked-in" ||
                                checkInMutation.isPending
                              }
                            >
                              {attendee.status === "checked-in" ? (
                                "Checked In"
                              ) : checkInMutation.isPending ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                "Check In"
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  {searchTerm ? (
                    <>
                      <p>No attendees found matching "{searchTerm}"</p>
                      <Button
                        variant="link"
                        onClick={() => setSearchTerm("")}
                        className="mt-2"
                      >
                        Clear search
                      </Button>
                    </>
                  ) : (
                    <p>No attendees registered for this event yet</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
