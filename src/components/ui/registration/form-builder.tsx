"use client";

import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSection } from "./form-section";
import { Plus, Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/trpc/react";

interface Field {
  id: string;
  label: string;
  type: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  order: number;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  fields: Field[];
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  order: number;
}

interface FormBuilderProps {
  eventId: string;
  formId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Define form schema
const formSchema = z.object({
  name: z.string().min(1, "Form name is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  requiresApproval: z.boolean().default(false),
  collectPayment: z.boolean().default(false),
  paymentAmount: z.number().optional(),
  paymentCurrency: z.string().default("USD"),
  paymentDescription: z.string().optional(),
  maxRegistrations: z.number().optional(),
});

export function FormBuilder({ eventId, formId, onSuccess, onCancel }: FormBuilderProps) {
  const { toast } = useToast();
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
      isDefault: false,
      requiresApproval: false,
      collectPayment: false,
      paymentCurrency: "USD",
    },
  });

  // Fetch form data if editing
  const { data: formData, isLoading: isLoadingForm } = api.registrationForm.getById.useQuery(
    { id: formId || "" },
    { enabled: !!formId }
  );

  // Create form mutation
  const createForm = api.registrationForm.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Form created",
        description: "Registration form has been created successfully",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create form",
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  // Update form mutation
  const updateForm = api.registrationForm.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Form updated",
        description: "Registration form has been updated successfully",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update form",
        variant: "destructive",
      });
      setIsSaving(false);
    },
  });

  // Load form data when editing
  useEffect(() => {
    if (formData) {
      // Set form values
      form.reset({
        name: formData.name,
        description: formData.description || "",
        isActive: formData.isActive,
        isDefault: formData.isDefault || false,
        requiresApproval: formData.requiresApproval || false,
        collectPayment: formData.collectPayment || false,
        paymentAmount: formData.paymentAmount,
        paymentCurrency: formData.paymentCurrency || "USD",
        paymentDescription: formData.paymentDescription || "",
        maxRegistrations: formData.maxRegistrations,
      });

      // Set sections
      if (formData.sections) {
        setSections(formData.sections);
      }
    }
  }, [formData, form]);

  // Add a new section
  const addSection = () => {
    const newSection: Section = {
      id: nanoid(),
      title: "New Section",
      fields: [],
      order: sections.length,
    };
    setSections([...sections, newSection]);
  };

  // Update a section
  const updateSection = (sectionId: string, updatedSection: Section) => {
    setSections(
      sections.map((section) => (section.id === sectionId ? updatedSection : section))
    );
  };

  // Delete a section
  const deleteSection = (sectionId: string) => {
    setSections(
      sections
        .filter((section) => section.id !== sectionId)
        .map((section, index) => ({ ...section, order: index }))
    );
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);

    // Validate sections
    if (sections.length === 0) {
      toast({
        title: "Validation error",
        description: "Please add at least one section to the form",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    // Validate fields
    for (const section of sections) {
      if (section.fields.length === 0) {
        toast({
          title: "Validation error",
          description: `Section "${section.title}" has no fields. Please add at least one field or remove the section.`,
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }
    }

    // Prepare data
    const formData = {
      ...values,
      eventId,
      sections: sections.map((section, sectionIndex) => ({
        ...section,
        order: sectionIndex,
        fields: section.fields.map((field, fieldIndex) => ({
          ...field,
          order: fieldIndex,
        })),
      })),
    };

    // Create or update form
    if (formId) {
      await updateForm.mutateAsync({
        id: formId,
        ...formData,
      });
    } else {
      await createForm.mutateAsync(formData);
    }
  };

  if (isLoadingForm) {
    return (
      <div className="flex h-40 items-center justify-center">
        <LoadingSpinner size="lg" text="Loading form..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Form Details</CardTitle>
              <CardDescription>
                Basic information about the registration form
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter form name" {...field} />
                    </FormControl>
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
                        placeholder="Enter form description"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This will be displayed to attendees at the top of the form
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Make this form available for registrations
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Default Form</FormLabel>
                        <FormDescription>
                          Set as the default registration form for this event
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requiresApproval"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Require Approval</FormLabel>
                        <FormDescription>
                          Registrations must be approved by an admin
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="collectPayment"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Collect Payment</FormLabel>
                        <FormDescription>
                          Require payment to complete registration
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {form.watch("collectPayment") && (
                <div className="grid grid-cols-1 gap-4 rounded-md border p-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="paymentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <Input placeholder="USD" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentDescription"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Payment Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Registration fee"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="maxRegistrations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Registrations</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Leave empty for unlimited"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Limit the number of registrations for this event
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="my-6">
            <h2 className="mb-4 text-xl font-semibold">Form Sections</h2>
            
            {sections.map((section) => (
              <FormSection
                key={section.id}
                section={section}
                onUpdate={updateSection}
                onDelete={deleteSection}
              />
            ))}
            
            <Button onClick={addSection} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </div>

          <div className="mt-6 flex justify-between">
            <Button type="button" variant="outline" onClick={onCancel}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {formId ? "Update Form" : "Create Form"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
