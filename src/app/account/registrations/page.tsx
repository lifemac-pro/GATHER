"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { AlertCircle, Calendar, Clock, ExternalLink, Eye, X } from "lucide-react";

export default function UserRegistrationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoaded, isSignedIn } = useUser();
  const [selectedRegistration, setSelectedRegistration] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // Get user registrations
  const { data: registrations, isLoading, refetch } = api.registrationSubmission.getByUser.useQuery(
    {},
    { enabled: isLoaded && isSignedIn }
  );

  // Get registration details
  const { data: registrationDetails, isLoading: isLoadingDetails } = api.registrationSubmission.getById.useQuery(
    { id: selectedRegistration || "" },
    { enabled: !!selectedRegistration }
  );

  // Get event details for each registration
  const { data: events, isLoading: isLoadingEvents } = api.event.getByIds.useQuery(
    { ids: registrations?.map((reg) => reg.eventId) || [] },
    { enabled: !!registrations?.length }
  );

  // Cancel registration mutation
  const cancelRegistration = api.registrationSubmission.updateStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "Registration cancelled",
        description: "Your registration has been cancelled successfully",
      });
      setIsCancelDialogOpen(false);
      void refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel registration",
        variant: "destructive",
      });
    },
  });

  // Handle cancel registration
  const handleCancelRegistration = async () => {
    if (!selectedRegistration) return;
    
    await cancelRegistration.mutateAsync({
      id: selectedRegistration,
      status: "cancelled",
    });
  };

  // Get event details by ID
  const getEventDetails = (eventId: string) => {
    return events?.find((event) => event.id === eventId);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed":
      case "approved":
        return "default";
      case "pending":
        return "outline";
      case "rejected":
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (!isLoaded || isLoading || isLoadingEvents) {
    return (
      <div className="container mx-auto flex h-[70vh] max-w-4xl items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading your registrations..." />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view your registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>You need to be signed in to access this page.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/sign-in?redirect=/account/registrations")}>
              Sign In
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <h1 className="mb-6 text-3xl font-bold">My Registrations</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Event Registrations</CardTitle>
          <CardDescription>
            View and manage your event registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registrations && registrations.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration) => {
                  const event = getEventDetails(registration.eventId);
                  
                  return (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">
                        {event?.name || "Unknown Event"}
                      </TableCell>
                      <TableCell>
                        {event ? (
                          format(new Date(event.startDate), "MMM d, yyyy")
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(registration.status)}>
                          {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(registration.submittedAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRegistration(registration.id);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          
                          {(registration.status === "pending" || registration.status === "approved") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRegistration(registration.id);
                                setIsCancelDialogOpen(true);
                              }}
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Cancel</span>
                            </Button>
                          )}
                          
                          {event && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/events/${event.id}`)}
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span className="sr-only">View Event</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center space-y-4 rounded-md border border-dashed p-8 text-center">
              <div className="text-muted-foreground">
                You haven&apos;t registered for any events yet
              </div>
              <Button onClick={() => router.push("/events")}>
                Browse Events
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* View Registration Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
            <DialogDescription>
              Submitted on{" "}
              {registrationDetails &&
                format(new Date(registrationDetails.submittedAt), "MMMM d, yyyy 'at' h:mm a")}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="flex h-40 items-center justify-center">
              <LoadingSpinner size="md" text="Loading details..." />
            </div>
          ) : (
            registrationDetails && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant={getStatusBadgeVariant(registrationDetails.status)}>
                    {registrationDetails.status.charAt(0).toUpperCase() + registrationDetails.status.slice(1)}
                  </Badge>
                  
                  {registrationDetails.status === "rejected" && registrationDetails.rejectionReason && (
                    <div className="text-sm text-destructive">
                      Reason: {registrationDetails.rejectionReason}
                    </div>
                  )}
                </div>
                
                {/* Event details */}
                {events && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        {getEventDetails(registrationDetails.eventId)?.name || "Unknown Event"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {getEventDetails(registrationDetails.eventId) && (
                          <>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span>
                                {format(
                                  new Date(getEventDetails(registrationDetails.eventId)!.startDate),
                                  "MMMM d, yyyy"
                                )}
                              </span>
                            </div>
                            
                            {getEventDetails(registrationDetails.eventId)!.startTime && (
                              <div className="flex items-center">
                                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>
                                  {format(
                                    new Date(`2000-01-01T${getEventDetails(registrationDetails.eventId)!.startTime}`),
                                    "h:mm a"
                                  )}
                                  {getEventDetails(registrationDetails.eventId)!.endTime &&
                                    ` - ${format(
                                      new Date(`2000-01-01T${getEventDetails(registrationDetails.eventId)!.endTime}`),
                                      "h:mm a"
                                    )}`}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Form responses */}
                {registrationDetails.sections.map((section) => (
                  <Card key={section.sectionId}>
                    <CardHeader>
                      <CardTitle>{section.sectionTitle}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid gap-4 sm:grid-cols-2">
                        {section.fields.map((field) => (
                          <div key={field.fieldId} className="space-y-1">
                            <dt className="text-sm font-medium text-muted-foreground">
                              {field.fieldLabel}
                            </dt>
                            <dd className="text-sm">
                              {Array.isArray(field.value)
                                ? field.value.join(", ")
                                : field.value || "N/A"}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Payment info if applicable */}
                {registrationDetails.paymentStatus !== "not_required" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Status</span>
                          <Badge variant={registrationDetails.paymentStatus === "completed" ? "default" : "outline"}>
                            {registrationDetails.paymentStatus.charAt(0).toUpperCase() + registrationDetails.paymentStatus.slice(1)}
                          </Badge>
                        </div>
                        
                        {registrationDetails.paymentAmount && (
                          <div className="flex justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Amount</span>
                            <span>
                              {registrationDetails.paymentAmount} {registrationDetails.paymentCurrency || "USD"}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
      
      {/* Cancel Registration Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your registration? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              <div className="flex items-center">
                <AlertCircle className="mr-2 h-4 w-4" />
                <p>
                  Cancelling your registration may result in losing your spot. If you change your mind, you may need to register again.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Keep Registration
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelRegistration}
              disabled={cancelRegistration.isLoading}
            >
              {cancelRegistration.isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Cancelling...
                </>
              ) : (
                "Cancel Registration"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
