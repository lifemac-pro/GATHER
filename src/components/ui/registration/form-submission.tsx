"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Check, AlertCircle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

interface FormSubmissionProps {
  formId: string;
  eventId: string;
  userId: string;
  onSuccess?: () => void;
}

export function FormSubmission({ formId, eventId, userId, onSuccess }: FormSubmissionProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSchema, setFormSchema] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);

  // Fetch form data
  const { data: form, isLoading } = api.registrationForm.getById.useQuery(
    { id: formId },
    { enabled: !!formId }
  );

  // Submit form mutation
  const submitForm = api.registrationSubmission.submit.useMutation({
    onSuccess: () => {
      toast({
        title: "Registration submitted",
        description: "Your registration has been submitted successfully",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit registration",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Build dynamic form schema based on form fields
  useEffect(() => {
    if (form) {
      // Create schema object
      const schemaObj: Record<string, any> = {};
      const defaultValues: Record<string, any> = {};

      // Process all sections and fields
      form.sections.forEach((section) => {
        section.fields.forEach((field) => {
          const fieldId = `${section.id}_${field.id}`;
          
          // Define schema based on field type
          let fieldSchema;
          
          switch (field.type) {
            case "email":
              fieldSchema = z.string().email("Please enter a valid email address");
              break;
            case "number":
              fieldSchema = z.string().refine((val) => !isNaN(Number(val)), {
                message: "Please enter a valid number",
              });
              break;
            case "date":
              fieldSchema = z.date({
                required_error: "Please select a date",
              });
              break;
            case "checkbox":
              fieldSchema = z.array(z.string()).optional();
              defaultValues[fieldId] = [];
              break;
            default:
              fieldSchema = z.string();
              break;
          }
          
          // Add required validation if needed
          if (field.required) {
            if (field.type === "checkbox") {
              fieldSchema = z.array(z.string()).min(1, "Please select at least one option");
            } else {
              fieldSchema = fieldSchema.min(1, "This field is required");
            }
          } else {
            if (field.type !== "checkbox") {
              fieldSchema = fieldSchema.optional();
            }
          }
          
          schemaObj[fieldId] = fieldSchema;
          
          // Set default value if provided
          if (field.defaultValue && field.type !== "checkbox") {
            defaultValues[fieldId] = field.defaultValue;
          }
        });
      });

      // Create the form schema
      setFormSchema(z.object(schemaObj));
      setFormData({ defaultValues });
    }
  }, [form]);

  // Initialize form once schema is ready
  const formMethods = useForm<any>({
    resolver: formSchema ? zodResolver(formSchema) : undefined,
    defaultValues: formData?.defaultValues,
  });

  // Handle form submission
  const onSubmit = async (values: any) => {
    setIsSubmitting(true);

    if (!form) {
      toast({
        title: "Error",
        description: "Form data not available",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Process form values into sections and fields format
    const sections = form.sections.map((section) => {
      const fields = section.fields.map((field) => {
        const fieldId = `${section.id}_${field.id}`;
        return {
          fieldId: field.id,
          fieldLabel: field.label,
          value: values[fieldId],
        };
      });

      return {
        sectionId: section.id,
        sectionTitle: section.title,
        fields,
      };
    });

    // Submit the form
    await submitForm.mutateAsync({
      formId,
      eventId,
      userId,
      sections,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <LoadingSpinner size="lg" text="Loading registration form..." />
      </div>
    );
  }

  if (!form) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>Form Not Found</CardTitle>
          </div>
          <CardDescription>
            The registration form you&apos;re looking for doesn&apos;t exist or has been removed.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Check if form is not active
  if (!form.isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{form.name}</CardTitle>
          <CardDescription>
            This registration form is currently not active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Registration is not currently available for this event.</p>
        </CardContent>
      </Card>
    );
  }

  // Check if registration period has ended
  if (form.endDate && new Date(form.endDate) < new Date()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{form.name}</CardTitle>
          <CardDescription>
            Registration for this event has closed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>The registration period for this event has ended.</p>
        </CardContent>
      </Card>
    );
  }

  // Check if registration period has not started
  if (form.startDate && new Date(form.startDate) > new Date()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{form.name}</CardTitle>
          <CardDescription>
            Registration for this event is not yet open.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Registration will open on{" "}
            {format(new Date(form.startDate), "MMMM d, yyyy")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{form.name}</CardTitle>
          {form.description && <CardDescription>{form.description}</CardDescription>}
        </CardHeader>
      </Card>

      {formSchema && (
        <Form {...formMethods}>
          <form onSubmit={formMethods.handleSubmit(onSubmit)}>
            {form.sections.map((section: any) => (
              <Card key={section.id} className="mb-6">
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                  {section.description && (
                    <CardDescription>{section.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.fields.map((field: any) => {
                    const fieldId = `${section.id}_${field.id}`;
                    
                    return (
                      <div key={field.id}>
                        {field.type === "text" && (
                          <FormField
                            control={formMethods.control}
                            name={fieldId}
                            render={({ field: formField }) => (
                              <FormItem>
                                <FormLabel>
                                  {field.label}
                                  {field.required && <span className="ml-1 text-red-500">*</span>}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={field.placeholder}
                                    {...formField}
                                  />
                                </FormControl>
                                {field.helpText && (
                                  <FormDescription>{field.helpText}</FormDescription>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {field.type === "email" && (
                          <FormField
                            control={formMethods.control}
                            name={fieldId}
                            render={({ field: formField }) => (
                              <FormItem>
                                <FormLabel>
                                  {field.label}
                                  {field.required && <span className="ml-1 text-red-500">*</span>}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder={field.placeholder}
                                    {...formField}
                                  />
                                </FormControl>
                                {field.helpText && (
                                  <FormDescription>{field.helpText}</FormDescription>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {field.type === "phone" && (
                          <FormField
                            control={formMethods.control}
                            name={fieldId}
                            render={({ field: formField }) => (
                              <FormItem>
                                <FormLabel>
                                  {field.label}
                                  {field.required && <span className="ml-1 text-red-500">*</span>}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="tel"
                                    placeholder={field.placeholder || "e.g. +1 (555) 123-4567"}
                                    {...formField}
                                  />
                                </FormControl>
                                {field.helpText && (
                                  <FormDescription>{field.helpText}</FormDescription>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {field.type === "number" && (
                          <FormField
                            control={formMethods.control}
                            name={fieldId}
                            render={({ field: formField }) => (
                              <FormItem>
                                <FormLabel>
                                  {field.label}
                                  {field.required && <span className="ml-1 text-red-500">*</span>}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder={field.placeholder}
                                    {...formField}
                                  />
                                </FormControl>
                                {field.helpText && (
                                  <FormDescription>{field.helpText}</FormDescription>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {field.type === "textarea" && (
                          <FormField
                            control={formMethods.control}
                            name={fieldId}
                            render={({ field: formField }) => (
                              <FormItem>
                                <FormLabel>
                                  {field.label}
                                  {field.required && <span className="ml-1 text-red-500">*</span>}
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder={field.placeholder}
                                    rows={4}
                                    {...formField}
                                  />
                                </FormControl>
                                {field.helpText && (
                                  <FormDescription>{field.helpText}</FormDescription>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {field.type === "date" && (
                          <FormField
                            control={formMethods.control}
                            name={fieldId}
                            render={({ field: formField }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>
                                  {field.label}
                                  {field.required && <span className="ml-1 text-red-500">*</span>}
                                </FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !formField.value && "text-muted-foreground"
                                        )}
                                      >
                                        {formField.value ? (
                                          format(formField.value, "PPP")
                                        ) : (
                                          <span>{field.placeholder || "Select a date"}</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={formField.value}
                                      onSelect={formField.onChange}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                {field.helpText && (
                                  <FormDescription>{field.helpText}</FormDescription>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {field.type === "select" && field.options && (
                          <FormField
                            control={formMethods.control}
                            name={fieldId}
                            render={({ field: formField }) => (
                              <FormItem>
                                <FormLabel>
                                  {field.label}
                                  {field.required && <span className="ml-1 text-red-500">*</span>}
                                </FormLabel>
                                <Select
                                  onValueChange={formField.onChange}
                                  defaultValue={formField.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder={field.placeholder || "Select an option"} />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {field.options.map((option: string) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {field.helpText && (
                                  <FormDescription>{field.helpText}</FormDescription>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {field.type === "radio" && field.options && (
                          <FormField
                            control={formMethods.control}
                            name={fieldId}
                            render={({ field: formField }) => (
                              <FormItem>
                                <FormLabel>
                                  {field.label}
                                  {field.required && <span className="ml-1 text-red-500">*</span>}
                                </FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={formField.onChange}
                                    defaultValue={formField.value}
                                    className="space-y-1"
                                  >
                                    {field.options.map((option: string) => (
                                      <div key={option} className="flex items-center space-x-2">
                                        <RadioGroupItem value={option} id={`${fieldId}-${option}`} />
                                        <label
                                          htmlFor={`${fieldId}-${option}`}
                                          className="text-sm font-normal"
                                        >
                                          {option}
                                        </label>
                                      </div>
                                    ))}
                                  </RadioGroup>
                                </FormControl>
                                {field.helpText && (
                                  <FormDescription>{field.helpText}</FormDescription>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {field.type === "checkbox" && field.options && (
                          <FormField
                            control={formMethods.control}
                            name={fieldId}
                            render={({ field: formField }) => (
                              <FormItem>
                                <FormLabel>
                                  {field.label}
                                  {field.required && <span className="ml-1 text-red-500">*</span>}
                                </FormLabel>
                                <div className="space-y-2">
                                  {field.options.map((option: string) => (
                                    <div key={option} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`${fieldId}-${option}`}
                                        checked={formField.value?.includes(option)}
                                        onCheckedChange={(checked) => {
                                          const currentValue = formField.value || [];
                                          const newValue = checked
                                            ? [...currentValue, option]
                                            : currentValue.filter((value: string) => value !== option);
                                          formField.onChange(newValue);
                                        }}
                                      />
                                      <label
                                        htmlFor={`${fieldId}-${option}`}
                                        className="text-sm font-normal"
                                      >
                                        {option}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                                {field.helpText && (
                                  <FormDescription>{field.helpText}</FormDescription>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}

            {form.collectPayment && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                  <CardDescription>
                    Registration fee: {form.paymentAmount} {form.paymentCurrency}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {form.paymentDescription || "Payment will be collected after submission."}
                  </p>
                </CardContent>
              </Card>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Submit Registration
                </>
              )}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
