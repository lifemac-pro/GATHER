"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/trpc/react";
import { DynamicSurveyForm } from "@/components/ui/survey/dynamic-survey-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SurveyPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [submitted, setSubmitted] = useState(false);

  // Fetch survey template
  const {
    data: template,
    isLoading,
    error,
  } = api.surveyTemplate.getById.useQuery(
    { id: params.id },
    { enabled: !!params.id },
  );

  // Validate token
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenData, setTokenData] = useState<any>(null);

  useEffect(() => {
    if (!token) return;

    try {
      const decoded = atob(token);
      const data = JSON.parse(decoded);

      if (data.templateId === params.id) {
        setTokenValid(true);
        setTokenData(data);
      } else {
        setTokenValid(false);
      }
    } catch (error) {
      console.error("Error validating token:", error);
      setTokenValid(false);
    }
  }, [token, params.id]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading survey..." />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="container mx-auto max-w-3xl py-12">
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Survey Not Found</CardTitle>
            </div>
            <CardDescription>
              The survey you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/">
              <Button>Return to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (token === null) {
    return (
      <div className="container mx-auto max-w-3xl py-12">
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Invalid Access</CardTitle>
            </div>
            <CardDescription>
              This survey requires a valid access token. Please use the link
              provided in your invitation.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/">
              <Button>Return to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="container mx-auto max-w-3xl py-12">
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Invalid Token</CardTitle>
            </div>
            <CardDescription>
              The access token provided is invalid or has expired. Please use
              the link provided in your invitation.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/">
              <Button>Return to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container mx-auto max-w-3xl py-12">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <CardTitle>Thank You!</CardTitle>
            </div>
            <CardDescription>
              Your survey response has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We appreciate your feedback. It helps us improve our events and
              provide better experiences in the future.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/">
              <Button>Return to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>{template.name}</CardTitle>
          {template.description && (
            <CardDescription>{template.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {template.questions && template.questions.length > 0 ? (
            <DynamicSurveyForm
              templateId={params.id}
              token={token}
              questions={template.questions}
              onSuccess={() => setSubmitted(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">
                This survey doesn't have any questions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
