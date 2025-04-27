"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, MoreHorizontal, Search, Download, Eye } from "lucide-react";
import { api } from "@/trpc/react";

interface RegistrationManagerProps {
  eventId: string;
}

export function RegistrationManager({ eventId }: RegistrationManagerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Get submissions
  const { data: submissions, isLoading, refetch } = api.registrationSubmission.getByEvent.useQuery({
    eventId,
    status: activeTab !== "all" ? activeTab as any : undefined,
  });

  // Get stats
  const { data: stats } = api.registrationSubmission.getStats.useQuery({
    eventId,
  });

  // Get submission details
  const { data: submissionDetails, isLoading: isLoadingDetails } = api.registrationSubmission.getById.useQuery(
    { id: selectedSubmission || "" },
    { enabled: !!selectedSubmission }
  );

  // Update status mutation
  const updateStatus = api.registrationSubmission.updateStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Registration status has been updated successfully",
      });
      void refetch();
      setIsApproveDialogOpen(false);
      setIsRejectDialogOpen(false);
      setNotes("");
      setRejectionReason("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  // Handle approve
  const handleApprove = async () => {
    if (!selectedSubmission) return;
    
    await updateStatus.mutateAsync({
      id: selectedSubmission,
      status: "approved",
      notes,
    });
  };

  // Handle reject
  const handleReject = async () => {
    if (!selectedSubmission) return;
    
    if (!rejectionReason) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }
    
    await updateStatus.mutateAsync({
      id: selectedSubmission,
      status: "rejected",
      rejectionReason,
    });
  };

  // Filter submissions based on search query
  const filteredSubmissions = submissions?.filter((submission) => {
    if (!searchQuery) return true;
    
    // Search in all fields
    const searchLower = searchQuery.toLowerCase();
    
    // Check in sections and fields
    for (const section of submission.sections) {
      if (section.sectionTitle.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      for (const field of section.fields) {
        if (
          field.fieldLabel.toLowerCase().includes(searchLower) ||
          String(field.value).toLowerCase().includes(searchLower)
        ) {
          return true;
        }
      }
    }
    
    return false;
  });

  // Get name and email from submission
  const getContactInfo = (submission: any) => {
    let name = "";
    let email = "";
    
    for (const section of submission.sections) {
      for (const field of section.fields) {
        if (field.fieldLabel.toLowerCase().includes("name")) {
          name = String(field.value);
        }
        if (field.fieldLabel.toLowerCase().includes("email")) {
          email = String(field.value);
        }
      }
    }
    
    return { name, email };
  };

  // Export registrations as CSV
  const exportCSV = () => {
    if (!submissions || submissions.length === 0) {
      toast({
        title: "No data",
        description: "There are no registrations to export",
        variant: "destructive",
      });
      return;
    }
    
    // Collect all field labels to create headers
    const allFields: Record<string, string> = {};
    
    submissions.forEach((submission) => {
      submission.sections.forEach((section) => {
        section.fields.forEach((field) => {
          allFields[field.fieldId] = field.fieldLabel;
        });
      });
    });
    
    // Create CSV headers
    const headers = [
      "Submission ID",
      "Status",
      "Submitted At",
      ...Object.values(allFields),
    ];
    
    // Create CSV rows
    const rows = submissions.map((submission) => {
      const row: Record<string, any> = {
        "Submission ID": submission.id,
        "Status": submission.status,
        "Submitted At": format(new Date(submission.submittedAt), "yyyy-MM-dd HH:mm:ss"),
      };
      
      // Add field values
      submission.sections.forEach((section) => {
        section.fields.forEach((field) => {
          row[field.fieldLabel] = field.value;
        });
      });
      
      return row;
    });
    
    // Convert to CSV
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => headers.map((header) => `"${(row[header] || "").toString().replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    
    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `registrations-${eventId}-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Registrations</h2>
          <p className="text-muted-foreground">
            Manage event registrations and attendees
          </p>
        </div>
        
        <Button onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalRegistrations}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.activeRegistrations}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.statusCounts?.pending || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.statusCounts?.rejected || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search registrations..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <LoadingSpinner size="lg" text="Loading registrations..." />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions && filteredSubmissions.length > 0 ? (
                    filteredSubmissions.map((submission) => {
                      const { name, email } = getContactInfo(submission);
                      
                      return (
                        <TableRow key={submission.id}>
                          <TableCell className="font-medium">{name || "N/A"}</TableCell>
                          <TableCell>{email || "N/A"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                submission.status === "confirmed" || submission.status === "approved"
                                  ? "default"
                                  : submission.status === "pending"
                                  ? "outline"
                                  : "destructive"
                              }
                            >
                              {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(submission.submittedAt), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedSubmission(submission.id);
                                    setIsViewDialogOpen(true);
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                
                                {submission.status === "pending" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedSubmission(submission.id);
                                        setIsApproveDialogOpen(true);
                                      }}
                                    >
                                      <Check className="mr-2 h-4 w-4" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedSubmission(submission.id);
                                        setIsRejectDialogOpen(true);
                                      }}
                                    >
                                      <X className="mr-2 h-4 w-4" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No registrations found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* View Registration Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
            <DialogDescription>
              Submitted on{" "}
              {submissionDetails &&
                format(new Date(submissionDetails.submittedAt), "MMMM d, yyyy 'at' h:mm a")}
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingDetails ? (
            <div className="flex h-40 items-center justify-center">
              <LoadingSpinner size="md" text="Loading details..." />
            </div>
          ) : (
            submissionDetails && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      submissionDetails.status === "confirmed" || submissionDetails.status === "approved"
                        ? "default"
                        : submissionDetails.status === "pending"
                        ? "outline"
                        : "destructive"
                    }
                  >
                    {submissionDetails.status.charAt(0).toUpperCase() + submissionDetails.status.slice(1)}
                  </Badge>
                  
                  {submissionDetails.status === "rejected" && submissionDetails.rejectionReason && (
                    <div className="text-sm text-destructive">
                      Reason: {submissionDetails.rejectionReason}
                    </div>
                  )}
                </div>
                
                {submissionDetails.sections.map((section) => (
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
                
                {submissionDetails.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Admin Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{submissionDetails.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )
          )}
        </DialogContent>
      </Dialog>
      
      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Registration</DialogTitle>
            <DialogDescription>
              This will approve the registration and create an attendee record.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="notes" className="mb-2 block text-sm font-medium">
                Notes (Optional)
              </label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this registration"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={updateStatus.isLoading}>
              {updateStatus.isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
            <DialogDescription>
              This will reject the registration. The applicant will be notified.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="reason" className="mb-2 block text-sm font-medium">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="reason"
                placeholder="Provide a reason for rejecting this registration"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                This reason will be shared with the applicant.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={updateStatus.isLoading || !rejectionReason}
            >
              {updateStatus.isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
