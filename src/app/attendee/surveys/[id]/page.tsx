"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { trackUserEvent } from "@/lib/analytics-client";
import { useUser } from "@clerk/nextjs";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Send, Clock } from "lucide-react";
import { format } from "date-fns";

export default function SurveyPage() {
  const params = useParams();
  const surveyId = params.id as string;
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch survey details
  const { data: survey, isLoading: isSurveyLoading } =
    api.survey.getById.useQuery(
      { id: surveyId },
      { enabled: !!surveyId }
    );

  // Track survey view
  useEffect(() => {
    if (user?.id && survey?.id && !isSurveyLoading) {
      trackUserEvent({
        userId: user.id,
        eventType: "survey_view",
        properties: {
          surveyId: survey.id,
          surveyTitle: survey.title,
          eventId: survey.eventId,
        },
      });
    }
  }, [user?.id, survey?.id, isSurveyLoading, survey?.title, survey?.eventId]);

  // Submit survey response
  const submitSurvey = api.survey.submitResponse.useMutation({
    onSuccess: () => {
      toast.success("Survey submitted successfully!");

      // Track survey submission
      if (user?.id && survey?.id) {
        trackUserEvent({
          userId: user.id,
          eventType: "survey_submission",
          properties: {
            surveyId: survey.id,
            surveyTitle: survey.title,
            eventId: survey.eventId,
          },
        });
      }

      router.push("/attendee/surveys");
    },
    onError: (error) => {
      toast.error(`Failed to submit survey: ${error.message}`);
      setIsSubmitting(false);
    }
  });

  const handleInputChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = () => {
    // Validate that all required questions are answered
    const unansweredRequired = survey?.questions
      .filter(q => q.required)
      .filter(q => !responses[q.id]);

    if (unansweredRequired && unansweredRequired.length > 0) {
      toast.error(`Please answer all required questions (${unansweredRequired.length} remaining)`);
      return;
    }

    setIsSubmitting(true);

    // Format responses for submission
    const formattedResponses = Object.entries(responses).map(([questionId, value]) => ({
      questionId,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value)
    }));

    submitSurvey.mutate({
      surveyId,
      responses: formattedResponses
    });
  };

  if (!isLoaded || isSurveyLoading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading survey..." />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="container py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Survey Not Found</CardTitle>
            <CardDescription>
              The survey you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/attendee/surveys")}>
              Back to Surveys
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Render different question types
  const renderQuestion = (question: any) => {
    switch (question.type) {
      case "text":
        return (
          <Textarea
            id={question.id}
            placeholder="Type your answer here..."
            value={responses[question.id] || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
            className="min-h-[100px]"
          />
        );

      case "rating":
        return (
          <RadioGroup
            value={responses[question.id]?.toString() || ""}
            onValueChange={(value) => handleInputChange(question.id, parseInt(value))}
            className="flex space-x-2"
          >
            {[1, 2, 3, 4, 5].map((rating) => (
              <div key={rating} className="flex flex-col items-center">
                <RadioGroupItem
                  value={rating.toString()}
                  id={`rating-${question.id}-${rating}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`rating-${question.id}-${rating}`}
                  className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-primary bg-background peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground"
                >
                  {rating}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "multiple_choice":
        return (
          <RadioGroup
            value={responses[question.id] || ""}
            onValueChange={(value) => handleInputChange(question.id, value)}
            className="space-y-2"
          >
            {question.options?.map((option: string) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option}
                  id={`option-${question.id}-${option}`}
                />
                <Label htmlFor={`option-${question.id}-${option}`}>
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case "checkbox":
        return (
          <div className="space-y-2">
            {question.options?.map((option: string) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`checkbox-${question.id}-${option}`}
                  checked={(responses[question.id] || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const currentValues = responses[question.id] || [];
                    const newValues = checked
                      ? [...currentValues, option]
                      : currentValues.filter((v: string) => v !== option);
                    handleInputChange(question.id, newValues);
                  }}
                />
                <Label htmlFor={`checkbox-${question.id}-${option}`}>
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <Textarea
            id={question.id}
            placeholder="Type your answer here..."
            value={responses[question.id] || ""}
            onChange={(e) => handleInputChange(question.id, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="container space-y-6 py-8">
      <Button
        variant="ghost"
        onClick={() => router.push("/attendee/surveys")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Surveys
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-2 md:flex-row md:items-start md:justify-between md:space-y-0">
            <div>
              <CardTitle className="text-2xl text-[#E1A913]">{survey.title}</CardTitle>
              <CardDescription className="mt-2">
                {survey.description}
              </CardDescription>
            </div>
            {survey.dueDate && (
              <div className="flex items-center rounded-md bg-amber-100 px-3 py-1 text-sm text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                <Clock className="mr-1 h-4 w-4" />
                Due by: {format(new Date(survey.dueDate), "MMM d, yyyy")}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {survey.questions.map((question: any, index: number) => (
            <div key={question.id} className="space-y-2 rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <Label className="text-base font-medium">
                  {index + 1}. {question.text}
                  {question.required && (
                    <span className="ml-1 text-destructive">*</span>
                  )}
                </Label>
                {question.required ? (
                  <span className="text-xs text-destructive">Required</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Optional</span>
                )}
              </div>
              {question.description && (
                <p className="text-sm text-muted-foreground">
                  {question.description}
                </p>
              )}
              <div className="mt-2">{renderQuestion(question)}</div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/attendee/surveys")}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[#00b0a6] text-white hover:bg-[#00b0a6]/90"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Submit Survey
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
