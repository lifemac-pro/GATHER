"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SurveyShare } from "@/components/ui/survey/survey-share";
import { SurveyResponseTracker } from "@/components/ui/survey/survey-response-tracker";
import { ArrowLeft, Edit, Send, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SurveyDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isSending, setIsSending] = useState(false);
  
  // Fetch survey template details
  const { data: template, isLoading } = api.surveyTemplate.getById.useQuery(
    { id: params.id },
    { enabled: !!params.id }
  );
  
  // Send survey now mutation
  const sendSurvey = api.surveyTemplate.sendNow.useMutation({
    onSuccess: () => {
      toast({
        title: "Survey sent",
        description: "The survey has been sent to all attendees.",
      });
      setIsSending(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send survey",
        variant: "destructive",
      });
      setIsSending(false);
    },
  });
  
  // Handle send now
  const handleSendNow = async () => {
    setIsSending(true);
    await sendSurvey.mutateAsync({ id: params.id });
  };
  
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
          onClick={() => router.push("/admin/surveys")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold text-[#072446]">{template.name}</h1>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/events/${template.eventId}/surveys`)}
        >
          View Event
        </Button>
        
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/surveys/${params.id}/edit`)}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Survey
        </Button>
        
        <SurveyShare 
          surveyId={template.id} 
          eventId={template.eventId}
          surveyName={template.name}
        />
        
        <Button
          variant="default"
          onClick={handleSendNow}
          disabled={isSending}
        >
          {isSending ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send to All Attendees
            </>
          )}
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Survey Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                      <div className="mt-1 flex items-center">
                        {template.isActive ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="mr-2 h-4 w-4 text-gray-500" />
                            <span>Inactive</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Send Timing</h3>
                      <p className="mt-1">
                        {template.sendTiming === "after_event" && (
                          <span>{template.sendDelay} hours after event</span>
                        )}
                        {template.sendTiming === "during_event" && (
                          <span>During event</span>
                        )}
                        {template.sendTiming === "custom" && template.sendTime && (
                          <span>
                            {new Date(template.sendTime).toLocaleString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {template.description && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                      <p className="mt-1">{template.description}</p>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Reminders</h3>
                    <p className="mt-1">
                      {template.reminderEnabled ? (
                        <span>Enabled ({template.reminderDelay} hours after initial send)</span>
                      ) : (
                        <span>Disabled</span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border p-4">
                    <h2 className="mb-4 text-xl font-bold">{template.name}</h2>
                    {template.description && (
                      <p className="mb-6 text-muted-foreground">{template.description}</p>
                    )}
                    
                    <div className="space-y-6">
                      {template.questions?.map((question, index) => (
                        <div key={question.id || index} className="space-y-2">
                          <h3 className="font-medium">
                            {index + 1}. {question.text}
                            {question.required && (
                              <span className="ml-1 text-red-500">*</span>
                            )}
                          </h3>
                          
                          {question.type === "text" && (
                            <div className="h-10 rounded-md border bg-muted/30"></div>
                          )}
                          
                          {question.type === "rating" && (
                            <div className="flex space-x-2">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <div 
                                  key={rating}
                                  className="flex h-8 w-8 items-center justify-center rounded-full border"
                                >
                                  {rating}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {(question.type === "multiple_choice" || question.type === "checkbox") && (
                            <div className="space-y-2">
                              {question.options?.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center space-x-2">
                                  <div className={`h-4 w-4 rounded${question.type === "checkbox" ? "" : "-full"} border`}></div>
                                  <span>{option}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {question.type === "dropdown" && (
                            <div className="h-10 rounded-md border bg-muted/30"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="questions" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Survey Questions</CardTitle>
                  <CardDescription>
                    This survey has {template.questions?.length || 0} questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {template.questions?.map((question, index) => (
                      <div 
                        key={question.id || index}
                        className="rounded-md border p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="font-medium">Question {index + 1}</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">
                              {question.type.replace("_", " ")}
                            </span>
                            {question.required && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p>{question.text}</p>
                        
                        {(question.type === "multiple_choice" || 
                          question.type === "checkbox" || 
                          question.type === "dropdown") && 
                          question.options && question.options.length > 0 && (
                          <div className="mt-2">
                            <h4 className="text-xs font-medium text-muted-foreground">Options:</h4>
                            <ul className="mt-1 list-inside list-disc">
                              {question.options.map((option, optIndex) => (
                                <li key={optIndex} className="text-sm">
                                  {option}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <SurveyResponseTracker 
            surveyId={template.id}
            eventId={template.eventId}
          />
        </div>
      </div>
    </div>
  );
}
