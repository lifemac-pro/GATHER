"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { SurveyTemplateForm } from "@/components/ui/survey/survey-template-form";
import { SurveyShare } from "@/components/ui/survey/survey-share";
import { format } from "date-fns";
import {
  Plus,
  Edit,
  Trash2,
  Send,
  BarChart,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export default function EventSurveysPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<string | null>(null);

  // Fetch event details
  const { data: event, isLoading: isLoadingEvent } = api.event.getById.useQuery(
    { id: params.id },
    { enabled: !!params.id },
  );

  // Fetch survey templates
  const {
    data: templates,
    isLoading: isLoadingTemplates,
    refetch: refetchTemplates,
  } = api.surveyTemplate.getByEvent.useQuery(
    { eventId: params.id },
    { enabled: !!params.id },
  );

  // Delete template mutation
  const deleteTemplate = api.surveyTemplate.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Survey template deleted",
        description: "The survey template has been deleted successfully.",
      });
      refetchTemplates();
      setIsDeleting(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete survey template",
        variant: "destructive",
      });
    },
  });

  // Send survey now mutation
  const sendSurvey = api.surveyTemplate.sendNow.useMutation({
    onSuccess: () => {
      toast({
        title: "Survey sent",
        description: "The survey has been sent to all attendees.",
      });
      setIsSending(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send survey",
        variant: "destructive",
      });
      setIsSending(null);
    },
  });

  // Handle delete
  const handleDelete = async (id: string) => {
    await deleteTemplate.mutateAsync({ id });
  };

  // Handle send now
  const handleSendNow = async (id: string) => {
    setIsSending(id);
    await sendSurvey.mutateAsync({ id });
  };

  if (isLoadingEvent || isLoadingTemplates) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading surveys..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Event Not Found</CardTitle>
            </div>
            <CardDescription>
              The event you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/admin/events")}>
              Back to Events
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <p className="text-muted-foreground">Survey Management</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Survey
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create Survey</DialogTitle>
              <DialogDescription>
                Create a new survey for this event
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto py-4">
              <SurveyTemplateForm
                eventId={params.id}
                onSuccess={() => {
                  setIsCreating(false);
                  refetchTemplates();
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Survey Templates</CardTitle>
          <CardDescription>
            Create and manage surveys for this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates && templates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Send Timing</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      {template.name}
                    </TableCell>
                    <TableCell>
                      {template.isActive ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Active
                        </div>
                      ) : (
                        <div className="flex items-center text-gray-500">
                          <XCircle className="mr-1 h-4 w-4" />
                          Inactive
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {template.sendTiming === "after_event" && (
                        <span>{template.sendDelay} hours after event</span>
                      )}
                      {template.sendTiming === "during_event" && (
                        <span>During event</span>
                      )}
                      {template.sendTiming === "custom" &&
                        template.sendTime && (
                          <span>
                            {format(
                              new Date(template.sendTime),
                              "MMM d, yyyy h:mm a",
                            )}
                          </span>
                        )}
                    </TableCell>
                    <TableCell>{template.questions?.length || 0}</TableCell>
                    <TableCell>
                      {format(new Date(template.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <SurveyShare
                          surveyId={template.id}
                          eventId={params.id}
                          surveyName={template.name}
                        />

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleSendNow(template.id)}
                          disabled={isSending === template.id}
                          title="Send to all attendees"
                        >
                          {isSending === template.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>

                        <Dialog
                          open={isEditing === template.id}
                          onOpenChange={(open) => {
                            if (!open) setIsEditing(null);
                            else setIsEditing(template.id);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Edit Survey</DialogTitle>
                              <DialogDescription>
                                Edit this survey template
                              </DialogDescription>
                            </DialogHeader>
                            <div className="max-h-[70vh] overflow-y-auto py-4">
                              <SurveyTemplateForm
                                eventId={params.id}
                                templateId={template.id}
                                onSuccess={() => {
                                  setIsEditing(null);
                                  refetchTemplates();
                                }}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog
                          open={isDeleting === template.id}
                          onOpenChange={(open) => {
                            if (!open) setIsDeleting(null);
                            else setIsDeleting(template.id);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Survey</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this survey
                                template? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsDeleting(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(template.id)}
                                disabled={deleteTemplate.isLoading}
                              >
                                {deleteTemplate.isLoading ? (
                                  <>
                                    <LoadingSpinner
                                      size="sm"
                                      className="mr-2"
                                    />
                                    Deleting...
                                  </>
                                ) : (
                                  "Delete"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <AlertCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-medium">No Surveys Yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Create your first survey to collect feedback from attendees.
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Survey
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
