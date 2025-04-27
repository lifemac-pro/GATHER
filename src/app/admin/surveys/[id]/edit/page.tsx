"use client";

import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SurveyTemplateForm } from "@/components/ui/survey/survey-template-form";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditSurveyPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  // Fetch survey template details
  const { data: template, isLoading } = api.surveyTemplate.getById.useQuery(
    { id: params.id },
    { enabled: !!params.id }
  );
  
  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium">Loading survey details...</p>
        </div>
      </div>
    );
  }
  
  if (!template) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <CardTitle>Survey Not Found</CardTitle>
            </div>
            <CardDescription>
              The survey you&apos;re looking for doesn&apos;t exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/admin/surveys")}>
              Back to Surveys
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push(`/admin/surveys/${params.id}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold text-[#072446]">Edit Survey</h1>
      </div>
      
      <SurveyTemplateForm 
        eventId={template.eventId}
        templateId={params.id}
        onSuccess={() => {
          router.push(`/admin/surveys/${params.id}`);
        }}
      />
    </div>
  );
}
