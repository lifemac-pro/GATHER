"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Star } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { type SurveyQuestion } from "@/server/db/models/types";

interface DynamicSurveyFormProps {
  templateId: string;
  token: string;
  questions: SurveyQuestion[];
  onSuccess?: () => void;
}

export function DynamicSurveyForm({
  templateId,
  token,
  questions,
  onSuccess,
}: DynamicSurveyFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState<Record<string, number>>(
    {},
  );

  // Create a dynamic schema based on the questions
  const createDynamicSchema = () => {
    const schemaFields: Record<string, any> = {};

    questions.forEach((question) => {
      let fieldSchema;

      switch (question.type) {
        case "text":
          fieldSchema = question.required
            ? z.string().min(1, "This field is required")
            : z.string().optional();
          break;

        case "rating":
          fieldSchema = question.required
            ? z.number().min(1).max(5)
            : z.number().min(1).max(5).optional();
          break;

        case "multiple_choice":
          fieldSchema = question.required
            ? z.string().min(1, "Please select an option")
            : z.string().optional();
          break;

        case "checkbox":
          fieldSchema = question.required
            ? z.array(z.string()).min(1, "Please select at least one option")
            : z.array(z.string()).optional();
          break;

        case "dropdown":
          fieldSchema = question.required
            ? z.string().min(1, "Please select an option")
            : z.string().optional();
          break;

        default:
          fieldSchema = z.string().optional();
      }

      schemaFields[question.id] = fieldSchema;
    });

    return z.object({
      ...schemaFields,
      feedback: z.string().optional(),
    });
  };

  const dynamicSchema = createDynamicSchema();
  type FormData = z.infer<typeof dynamicSchema>;

  // Create default values
  const createDefaultValues = () => {
    const defaults: Record<string, any> = {};

    questions.forEach((question) => {
      switch (question.type) {
        case "checkbox":
          defaults[question.id] = [];
          break;
        case "rating":
          defaults[question.id] = 0;
          break;
        default:
          defaults[question.id] = "";
      }
    });

    defaults.feedback = "";

    return defaults;
  };

  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: createDefaultValues(),
  });

  // Submit survey mutation
  const submitSurvey = api.survey.submit.useMutation({
    onSuccess: () => {
      toast({
        title: "Survey submitted",
        description: "Thank you for your feedback!",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit survey",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Form submission
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Format responses for API
      const responses = questions.map((question) => {
        return {
          questionId: question.id,
          questionText: question.text,
          answer: data[question.id],
        };
      });

      // Find the rating question if it exists
      const ratingQuestion = questions.find((q) => q.type === "rating");
      const rating = ratingQuestion
        ? (data[ratingQuestion.id] as number)
        : undefined;

      await submitSurvey.mutateAsync({
        templateId,
        token,
        responses,
        rating,
        feedback: data.feedback!,
      });
    } catch (error) {
      console.error("Error submitting survey:", error);
      setIsSubmitting(false);
    }
  };

  // Rating helpers
  const ratingLabels: Record<number, string> = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent",
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {questions
          .sort((a, b) => a.order - b.order)
          .map((question) => (
            <FormField
              key={question.id}
              control={form.control}
              name={question.id as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {question.text}
                    {question.required && (
                      <span className="ml-1 text-destructive">*</span>
                    )}
                  </FormLabel>
                  <FormControl>
                    {question.type === "text" && (
                      <Textarea
                        {...field}
                        placeholder="Your answer"
                        className="min-h-[100px]"
                      />
                    )}

                    {question.type === "rating" && (
                      <div className="space-y-2">
                        <div className="flex justify-center gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              className="transition-transform hover:scale-110 focus:outline-none"
                              onMouseEnter={() =>
                                setHoveredRating({
                                  ...hoveredRating,
                                  [question.id]: rating,
                                })
                              }
                              onMouseLeave={() =>
                                setHoveredRating({
                                  ...hoveredRating,
                                  [question.id]: 0,
                                })
                              }
                              onClick={() => field.onChange(rating)}
                            >
                              <Star
                                className={`h-8 w-8 ${
                                  rating <=
                                  (hoveredRating[question.id] || field.value)
                                    ? "text-[#E1A913]"
                                    : "text-gray-300"
                                }`}
                                fill={
                                  rating <=
                                  (hoveredRating[question.id] || field.value)
                                    ? "#E1A913"
                                    : "none"
                                }
                              />
                            </button>
                          ))}
                        </div>
                        {(hoveredRating[question.id] || field.value) > 0 && (
                          <p className="text-center text-sm text-[#072446]">
                            {
                              ratingLabels[
                                (hoveredRating[question.id] ||
                                  field.value) as keyof typeof ratingLabels
                              ]
                            }
                          </p>
                        )}
                      </div>
                    )}

                    {question.type === "multiple_choice" && (
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value as string}
                        className="space-y-2"
                      >
                        {question.options?.map((option, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem
                              value={option}
                              id={`${question.id}-option-${index}`}
                            />
                            <label
                              htmlFor={`${question.id}-option-${index}`}
                              className="text-sm font-normal"
                            >
                              {option}
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {question.type === "checkbox" && (
                      <div className="space-y-2">
                        {question.options?.map((option, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`${question.id}-option-${index}`}
                              checked={(field.value as string[])?.includes(
                                option,
                              )}
                              onCheckedChange={(checked) => {
                                const currentValues = [
                                  ...((field.value as string[]) || []),
                                ];
                                if (checked) {
                                  field.onChange([...currentValues, option]);
                                } else {
                                  field.onChange(
                                    currentValues.filter(
                                      (value) => value !== option,
                                    ),
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={`${question.id}-option-${index}`}
                              className="text-sm font-normal"
                            >
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}

                    {question.type === "dropdown" && (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value as string}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {question.options?.map((option, index) => (
                            <SelectItem key={index} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

        <FormField
          control={form.control}
          name="feedback"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Comments (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Share any additional thoughts or feedback..."
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormDescription>
                Any other feedback you'd like to share with the organizers
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Submitting...
              </>
            ) : (
              "Submit Survey"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
