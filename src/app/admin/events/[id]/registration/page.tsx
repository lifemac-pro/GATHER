"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { FormBuilder } from "@/components/ui/registration/form-builder";
import { RegistrationManager } from "@/components/ui/registration/registration-manager";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Plus, MoreHorizontal, Edit, Copy, Trash2, Check, AlertCircle } from "lucide-react";

export default function EventRegistrationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("forms");
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Get event details
  const { data: event, isLoading: isLoadingEvent } = api.event.getById.useQuery(
    { id: params.id },
    { enabled: !!params.id }
  );

  // Get registration forms
  const { data: forms, isLoading: isLoadingForms, refetch: refetchForms } = api.registrationForm.getByEvent.useQuery<
    { id: string; name: string; isActive: boolean; isDefault: boolean; createdAt: string }[]
  >(
    { eventId: params.id },
    { enabled: !!params.id }
  );

  // Clone form mutation
  const cloneForm = api.registrationForm.clone.useMutation({
    onSuccess: () => {
      toast({
        title: "Form cloned",
        description: "Registration form has been cloned successfully",
      });
      void refetchForms();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clone form",
        variant: "destructive",
      });
    },
  });

  // Delete form mutation
  const deleteForm = api.registrationForm.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Form deleted",
        description: "Registration form has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      void refetchForms();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete form",
        variant: "destructive",
      });
    },
  });

  // Handle clone form
  const handleCloneForm = async (formId: string) => {
    await cloneForm.mutateAsync({ id: formId });
  };

  // Handle delete form
  const handleDeleteForm = async () => {
    if (!selectedFormId) return;
    await deleteForm.mutateAsync({ id: selectedFormId });
  };

  if (isLoadingEvent) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading event details..." />
      </div>
    );
  }

  if (!event) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>Event Not Found</CardTitle>
          </div>
          <CardDescription>
            The event you&apos;re looking for doesn&apos;t exist or has been removed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/admin/events")}>
            Back to Events
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#072446]">{event.name}</h1>
          <p className="text-muted-foreground">
            Manage registration forms and attendees
          </p>
        </div>
        
        {activeTab === "forms" && (
          <Button onClick={() => setIsCreateFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Form
          </Button>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="forms">Registration Forms</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="forms" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Registration Forms</CardTitle>
              <CardDescription>
                Create and manage registration forms for this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingForms ? (
                <div className="flex h-40 items-center justify-center">
                  <LoadingSpinner size="md" text="Loading forms..." />
                </div>
              ) : forms && forms.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forms.map((form) => (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">{form.name}</TableCell>
                        <TableCell>
                          {form.isActive ? (
                            <span className="flex items-center text-green-600">
                              <Check className="mr-1 h-4 w-4" />
                              Active
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Inactive</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {form.isDefault ? (
                            <span className="flex items-center text-primary">
                              <Check className="mr-1 h-4 w-4" />
                              Default
                            </span>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(form.createdAt), "MMM d, yyyy")}
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
                                  setSelectedFormId(form.id);
                                  setIsEditFormOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Form
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCloneForm(form.id)}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Clone Form
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedFormId(form.id);
                                  setIsDeleteDialogOpen(true);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Form
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex h-40 flex-col items-center justify-center space-y-4 rounded-md border border-dashed p-8 text-center">
                  <div className="text-muted-foreground">
                    No registration forms found for this event
                  </div>
                  <Button onClick={() => setIsCreateFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Form
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="registrations" className="pt-4">
          <RegistrationManager eventId={params.id} />
        </TabsContent>
      </Tabs>
      
      {/* Create Form Dialog */}
      <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Registration Form</DialogTitle>
            <DialogDescription>
              Create a new registration form for {event.name}
            </DialogDescription>
          </DialogHeader>
          
          <FormBuilder
            eventId={params.id}
            onSuccess={() => {
              setIsCreateFormOpen(false);
              void refetchForms();
            }}
            onCancel={() => setIsCreateFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Form Dialog */}
      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Registration Form</DialogTitle>
            <DialogDescription>
              Update the registration form for {event.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFormId && (
            <FormBuilder
              eventId={params.id}
              formId={selectedFormId}
              onSuccess={() => {
                setIsEditFormOpen(false);
                void refetchForms();
              }}
              onCancel={() => setIsEditFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Registration Form</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this registration form? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteForm}
              disabled={deleteForm.isLoading}
            >
              {deleteForm.isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
