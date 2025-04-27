"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Question text is required"),
  type: z.enum(["text", "rating", "multiple_choice", "checkbox", "dropdown"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  order: z.number(),
});

const formSchema = z.object({
  eventId: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  questions: z
    .array(questionSchema)
    .min(1, "At least one question is required"),
  isActive: z.boolean().default(true),
  sendTiming: z
    .enum(["after_event", "during_event", "custom"])
    .default("after_event"),
  sendDelay: z.number().optional(),
  sendTime: z.date().optional(),
  reminderEnabled: z.boolean().default(false),
  reminderDelay: z.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SurveyTemplateFormProps {
  eventId: string;
  templateId?: string;
  onSuccess?: () => void;
}

export function SurveyTemplateForm({
  eventId,
  templateId,
  onSuccess,
}: SurveyTemplateFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("questions");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch template data if editing
  const { data: templateData, isLoading: isLoadingTemplate } =
    api.surveyTemplate.getById.useQuery(
      { id: templateId! },
      { enabled: !!templateId },
    );

  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventId,
      name: "",
      description: "",
      questions: [
        {
          text: "",
          type: "text",
          required: false,
          order: 0,
        },
      ],
      isActive: true,
      sendTiming: "after_event",
      sendDelay: 24, // Default to 24 hours after event
      reminderEnabled: false,
      reminderDelay: 48, // Default to 48 hours after initial send
    },
  });

  // Field array for questions
  const { fields, append, remove, move, update } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  // Set form values when template data is loaded
  useEffect(() => {
    if (templateData) {
      form.reset({
        ...templateData,
        eventId: templateData.eventId,
      });
    }
  }, [templateData, form]);

  // API mutations
  const createTemplate = api.surveyTemplate.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Survey template created",
        description: "Your survey template has been created successfully.",
      });
      if (onSuccess) onSuccess();
      else router.push(`/admin/events/${eventId}/surveys`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create survey template",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const updateTemplate = api.surveyTemplate.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Survey template updated",
        description: "Your survey template has been updated successfully.",
      });
      if (onSuccess) onSuccess();
      else router.push(`/admin/events/${eventId}/surveys`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update survey template",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Form submission
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Ensure questions have correct order values
      const orderedQuestions = data.questions.map((q, index) => ({
        ...q,
        order: index,
      }));

      const formData = {
        ...data,
        questions: orderedQuestions,
      };

      if (templateId) {
        await updateTemplate.mutateAsync({
          id: templateId,
          ...formData,
        });
      } else {
        await createTemplate.mutateAsync(formData);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
    }
  };

  // Question type helpers
  const questionTypeOptions = [
    { value: "text", label: "Text" },
    { value: "rating", label: "Rating" },
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "checkbox", label: "Checkbox" },
    { value: "dropdown", label: "Dropdown" },
  ];

  const needsOptions = (type: string) => {
    return ["multiple_choice", "checkbox", "dropdown"].includes(type);
  };

  // Add a new question
  const addQuestion = () => {
    append({
      text: "",
      type: "text",
      required: false,
      order: fields.length,
    });
  };

  // Add a new option to a question
  const addOption = (questionIndex: number) => {
    const currentQuestion = form.getValues(`questions.${questionIndex}`);
    const currentOptions = currentQuestion.options || [];

    update(questionIndex, {
      ...currentQuestion,
      options: [...currentOptions, ""],
    });
  };

  // Remove an option from a question
  const removeOption = (questionIndex: number, optionIndex: number) => {
    const currentQuestion = form.getValues(`questions.${questionIndex}`);
    const currentOptions = [...(currentQuestion.options || [])];

    currentOptions.splice(optionIndex, 1);

    update(questionIndex, {
      ...currentQuestion,
      options: currentOptions,
    });
  };

  // Move a question up or down
  const moveQuestion = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < fields.length) {
      move(index, newIndex);
    }
  };

  if (isLoadingTemplate) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner size="lg" text="Loading survey template..." />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Survey Details</CardTitle>
                <CardDescription>
                  Basic information about your survey
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Survey Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Post-Event Feedback"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for your survey
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell respondents what this survey is about..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Survey Questions</CardTitle>
                  <CardDescription>
                    Create the questions for your survey
                  </CardDescription>
                </div>
                <Button type="button" onClick={addQuestion} size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Add Question
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {fields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                    <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No questions added yet. Click "Add Question" to get
                      started.
                    </p>
                  </div>
                ) : (
                  fields.map((field, index) => (
                    <Card key={field.id} className="relative">
                      <div className="absolute left-2 top-4 flex flex-col space-y-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => moveQuestion(index, "up")}
                          disabled={index === 0}
                          className="h-6 w-6"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => moveQuestion(index, "down")}
                          disabled={index === fields.length - 1}
                          className="h-6 w-6"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            Question {index + 1}
                          </CardTitle>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pb-4">
                        <FormField
                          control={form.control}
                          name={`questions.${index}.text`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Question Text</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`questions.${index}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Question Type</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a question type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {questionTypeOptions.map((option) => (
                                      <SelectItem
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`questions.${index}.required`}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-end space-x-3 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel>Required</FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>

                        {needsOptions(
                          form.watch(`questions.${index}.type`),
                        ) && (
                          <div className="space-y-2">
                            <FormLabel>Options</FormLabel>
                            {(
                              form.watch(`questions.${index}.options`) || []
                            ).map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                className="flex items-center space-x-2"
                              >
                                <FormField
                                  control={form.control}
                                  name={`questions.${index}.options.${optionIndex}`}
                                  render={({ field }) => (
                                    <FormItem className="flex-1">
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    removeOption(index, optionIndex)
                                  }
                                  className="h-8 w-8 text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(index)}
                              className="mt-2"
                            >
                              <Plus className="mr-1 h-4 w-4" />
                              Add Option
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Survey Settings</CardTitle>
                <CardDescription>
                  Configure when and how your survey is sent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Enable or disable this survey
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={form.control}
                  name="sendTiming"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>When to Send</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select when to send the survey" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="after_event">
                            After Event
                          </SelectItem>
                          <SelectItem value="during_event">
                            During Event
                          </SelectItem>
                          <SelectItem value="custom">Custom Time</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose when to send this survey to attendees
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("sendTiming") === "after_event" && (
                  <FormField
                    control={form.control}
                    name="sendDelay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hours After Event</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          How many hours after the event ends to send the survey
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch("sendTiming") === "custom" && (
                  <FormField
                    control={form.control}
                    name="sendTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Send Time</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={
                              field.value
                                ? new Date(field.value)
                                    .toISOString()
                                    .slice(0, 16)
                                : ""
                            }
                            onChange={(e) =>
                              field.onChange(new Date(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Specific date and time to send the survey
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Separator />

                <FormField
                  control={form.control}
                  name="reminderEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Send Reminder
                        </FormLabel>
                        <FormDescription>
                          Send a reminder to attendees who haven't completed the
                          survey
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("reminderEnabled") && (
                  <FormField
                    control={form.control}
                    name="reminderDelay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hours After Initial Send</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          How many hours after the initial survey to send the
                          reminder
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/events/${eventId}/surveys`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {templateId ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{templateId ? "Update" : "Create"} Survey</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
