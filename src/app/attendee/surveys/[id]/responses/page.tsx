"use client";

import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { api } from "@/trpc/react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function SurveyResponsesPage() {
  const params = useParams();
  const surveyId = params.id as string;
  const router = useRouter();
  const { isLoaded } = useUser();
  
  // Fetch survey details with responses
  const { data: surveyWithResponses, isLoading } = 
    api.survey.getResponsesById.useQuery(
      { id: surveyId },
      { enabled: !!surveyId && isLoaded }
    );

  if (!isLoaded || isLoading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading survey responses..." />
      </div>
    );
  }

  if (!surveyWithResponses) {
    return (
      <div className="container py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Survey Not Found</CardTitle>
            <CardDescription>
              The survey you're looking for doesn't exist or you don't have permission to view it.
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

  const { survey, responses } = surveyWithResponses;

  // Helper function to render response based on question type
  const renderResponse = (question: any, response: any) => {
    switch (question.type) {
      case "rating":
        return (
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <div
                key={rating}
                className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                  parseInt(response.value) === rating
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted bg-background text-muted-foreground"
                }`}
              >
                {rating}
              </div>
            ))}
          </div>
        );
      
      case "multiple_choice":
        return <p className="text-foreground">{response.value}</p>;
      
      case "checkbox":
        try {
          const values = JSON.parse(response.value);
          return (
            <ul className="list-inside list-disc space-y-1">
              {values.map((value: string) => (
                <li key={value} className="text-foreground">{value}</li>
              ))}
            </ul>
          );
        } catch {
          return <p className="text-foreground">{response.value}</p>;
        }
      
      default:
        return <p className="text-foreground">{response.value}</p>;
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
            <div className="flex items-center rounded-md bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-900 dark:text-green-100">
              <CheckCircle className="mr-1 h-4 w-4" />
              Completed
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4 text-[#00b0a6]" />
              Submitted on: {format(new Date(responses.submittedAt), "MMMM d, yyyy 'at' h:mm a")}
            </div>
            <div>
              Event: {survey.eventName}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-medium">Your Responses</h3>
          
          {survey.questions.map((question: any, index: number) => {
            const response = responses.answers.find((r: any) => r.questionId === question.id);
            
            return (
              <div key={question.id} className="space-y-2 rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <Label className="text-base font-medium">
                    {index + 1}. {question.text}
                  </Label>
                </div>
                {question.description && (
                  <p className="text-sm text-muted-foreground">
                    {question.description}
                  </p>
                )}
                <div className="mt-2">
                  {response ? (
                    renderResponse(question, response)
                  ) : (
                    <p className="text-muted-foreground italic">No response provided</p>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => router.push("/attendee/surveys")}
            className="bg-[#00b0a6] text-white hover:bg-[#00b0a6]/90"
          >
            Back to Surveys
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Label component for this page
function Label({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    />
  );
}
