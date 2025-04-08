"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

const formSchema = z.object({
  rating: z.number().min(1).max(5),
  feedback: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SurveyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventName: string;
}

export function SurveyFormDialog({
  open,
  onOpenChange,
  eventId,
  eventName,
}: SurveyFormDialogProps) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: 0,
      feedback: "",
    },
  });

  const createSurvey = api.survey.create.useMutation({
    onSuccess: () => {
      onOpenChange(false);
      form.reset();
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await createSurvey.mutateAsync({
        eventId,
        ...data,
      });
    } catch (error) {
      console.error("Failed to submit survey:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingLabels = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#072446]">
            Event Feedback
          </DialogTitle>
          <DialogDescription>
            Share your thoughts about {eventName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How would you rate this event?</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            className="transition-transform hover:scale-110 focus:outline-none"
                            onMouseEnter={() => setHoveredRating(rating)}
                            onMouseLeave={() => setHoveredRating(0)}
                            onClick={() => field.onChange(rating)}
                          >
                            <Star
                              className={`h-8 w-8 ${
                                rating <= (hoveredRating || field.value)
                                  ? "text-[#E1A913]"
                                  : "text-gray-300"
                              }`}
                              fill={
                                rating <= (hoveredRating || field.value)
                                  ? "#E1A913"
                                  : "none"
                              }
                            />
                          </button>
                        ))}
                      </div>
                      {(hoveredRating || field.value) > 0 && (
                        <p className="text-center text-sm text-[#072446]">
                          {
                            ratingLabels[
                              (hoveredRating || field.value) as keyof typeof ratingLabels
                            ]
                          }
                        </p>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Feedback (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Share your experience, suggestions, or any other feedback..."
                      className="h-32 resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#E1A913] text-[#072446] hover:bg-[#E1A913]/90"
                disabled={isSubmitting || form.getValues("rating") === 0}
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
