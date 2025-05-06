"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  Save,
  Trash2,
  Edit,
  Plus,
  FileText,
  Calendar,
  MapPin,
  DollarSign,
} from "lucide-react";

// Define the form schema
const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  location: z.string().optional(),
  duration: z
    .number()
    .min(30, "Duration must be at least 30 minutes")
    .max(1440 * 7, "Duration cannot exceed 7 days"),
  price: z.number().min(0, "Price cannot be negative"),
  maxAttendees: z.number().min(1, "Maximum attendees must be at least 1"),
  image: z.string().optional(),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

interface EventTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTemplate?: any;
}

export function EventTemplateDialog({
  open,
  onOpenChange,
  selectedTemplate,
}: EventTemplateDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  // Get templates
  const {
    data: templates,
    isLoading: isLoadingTemplates,
    refetch: refetchTemplates,
  } = api.eventTemplate.getAll.useQuery<{
    id: string;
    name: string;
    description?: string;
    category: string;
    location?: string;
    duration: number;
    price: number;
    maxAttendees: number;
    image?: string;
  }[]>();

  // Get categories
  const { data: categories } = api.event.getCategories.useQuery();

  // Create template mutation
  const createTemplate = api.eventTemplate.create.useMutation({
    onSuccess: () => {
      toast.success("Template created successfully");
      refetchTemplates();
      form.reset();
      setActiveTab("templates");
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });

  // Update template mutation
  const updateTemplate = api.eventTemplate.update.useMutation({
    onSuccess: () => {
      toast.success("Template updated successfully");
      refetchTemplates();
      form.reset();
      setSelectedTemplateId(null);
      setActiveTab("templates");
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });

  // Delete template mutation
  const deleteTemplate = api.eventTemplate.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deleted successfully");
      refetchTemplates();
      setSelectedTemplateId(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });

  // Create event from template mutation
  const createEventFromTemplate = api.eventTemplate.createEvent.useMutation({
    onSuccess: (data) => {
      toast.success("Event created from template");
      router.push(`/events/${data.id}`);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to create event: ${error.message}`);
    },
  });

  // Initialize form
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "general",
      location: "",
      duration: 120, // 2 hours default
      price: 0,
      maxAttendees: 50,
      image: "",
    },
  });

  // Update form when selected template changes
  useEffect(() => {
    if (selectedTemplateId && templates) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        form.reset({
          name: template.name,
          description: template.description || "",
          category: template.category,
          location: template.location || "",
          duration: template.duration || 120,
          price: template.price || 0,
          maxAttendees: template.maxAttendees || 50,
          image: template.image || "",
        });
        setActiveTab("edit");
      }
    }
  }, [selectedTemplateId, templates, form]);

  // Handle form submission
  const onSubmit = async (values: TemplateFormValues) => {
    if (selectedTemplateId) {
      // Update existing template
      await updateTemplate.mutateAsync({
        id: selectedTemplateId,
        ...values,
      });
    } else {
      // Create new template
      await createTemplate.mutateAsync(values);
    }
  };

  // Handle creating event from template
  const handleCreateEvent = async (templateId: string) => {
    // Get the current date and time
    const now = new Date();
    // Set the start date to the next hour
    const startDate = new Date(now);
    startDate.setHours(now.getHours() + 1);
    startDate.setMinutes(0);
    startDate.setSeconds(0);
    startDate.setMilliseconds(0);

    // Find the template
    const template = templates?.find((t) => t.id === templateId);
    if (!template) return;

    // Calculate end date based on duration
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + template.duration);

    // Create event from template
    await createEventFromTemplate.mutateAsync({
      templateId,
      startDate,
      endDate,
    });
  };

  // Handle deleting a template
  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      await deleteTemplate.mutateAsync({ id: templateId });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Event Templates</DialogTitle>
          <DialogDescription>
            Create and manage reusable templates for your events
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="edit">
              <Edit className="mr-2 h-4 w-4" />
              {selectedTemplateId ? "Edit Template" : "New Template"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4 py-4">
            {isLoadingTemplates ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" text="Loading templates..." />
              </div>
            ) : templates && templates.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {templates.map((template) => (
                  <Card key={template.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-2 text-sm">
                        {template.description && (
                          <p className="line-clamp-2 text-muted-foreground">
                            {template.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3.5 w-3.5" />
                            {Math.floor(template.duration / 60)}h{" "}
                            {template.duration % 60}m
                          </div>
                          {template.location && (
                            <div className="flex items-center">
                              <MapPin className="mr-1 h-3.5 w-3.5" />
                              {template.location}
                            </div>
                          )}
                          <div className="flex items-center">
                            <DollarSign className="mr-1 h-3.5 w-3.5" />$
                            {template.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      <div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplateId(template.id);
                            setActiveTab("edit");
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleCreateEvent(template.id)}
                        disabled={createEventFromTemplate.isPending}
                      >
                        {createEventFromTemplate.isPending ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        Create Event
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="mb-4 text-muted-foreground">No templates found</p>
                <Button
                  onClick={() => {
                    setSelectedTemplateId(null);
                    form.reset();
                    setActiveTab("edit");
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Button>
              </div>
            )}

            {templates && templates.length > 0 && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={() => {
                    setSelectedTemplateId(null);
                    form.reset();
                    setActiveTab("edit");
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Template
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="edit">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 py-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter template name" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for your event template
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter template description"
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        A brief description of the event template
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem
                                key={category.name}
                                value={category.name}
                              >
                                {category.name} ({category.count})
                              </SelectItem>
                            )) || (
                              <>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="tech">Technology</SelectItem>
                                <SelectItem value="business">
                                  Business
                                </SelectItem>
                                <SelectItem value="social">Social</SelectItem>
                                <SelectItem value="education">
                                  Education
                                </SelectItem>
                                <SelectItem value="entertainment">
                                  Entertainment
                                </SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter location" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={30}
                            step={15}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Event duration in minutes (e.g., 120 for 2 hours)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Set to 0 for free events
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxAttendees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Attendees</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter image URL" {...field} />
                        </FormControl>
                        <FormDescription>
                          Optional image URL for the template
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedTemplateId(null);
                      form.reset();
                      setActiveTab("templates");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createTemplate.isPending || updateTemplate.isPending
                    }
                  >
                    {createTemplate.isPending || updateTemplate.isPending ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : selectedTemplateId ? (
                      <Save className="mr-2 h-4 w-4" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    {selectedTemplateId ? "Update Template" : "Create Template"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
