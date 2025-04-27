"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/trpc/react";
import { Share, MessageSquare, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface SurveyShareProps {
  surveyId: string;
  eventId: string;
  surveyName: string;
}

export function SurveyShare({ surveyId, eventId, surveyName }: SurveyShareProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  // Get the survey URL
  const surveyUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/surveys/${surveyId}?token=` 
    : "";

  // Share via WhatsApp
  const shareViaWhatsApp = api.survey.shareViaWhatsApp.useMutation({
    onSuccess: () => {
      toast({
        title: "Survey shared",
        description: "The survey has been shared via WhatsApp",
      });
      setPhoneNumber("");
      setIsSending(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to share survey",
        variant: "destructive",
      });
      setIsSending(false);
    },
  });

  // Share via SMS
  const shareViaSMS = api.survey.shareViaSMS.useMutation({
    onSuccess: () => {
      toast({
        title: "Survey shared",
        description: "The survey has been shared via SMS",
      });
      setPhoneNumber("");
      setIsSending(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to share survey",
        variant: "destructive",
      });
      setIsSending(false);
    },
  });

  // Handle share
  const handleShare = async (method: "whatsapp" | "sms") => {
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    
    if (method === "whatsapp") {
      await shareViaWhatsApp.mutateAsync({
        surveyId,
        eventId,
        phoneNumber,
      });
    } else {
      await shareViaSMS.mutateAsync({
        surveyId,
        eventId,
        phoneNumber,
      });
    }
  };

  // Copy survey link to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(surveyUrl + "SURVEY_TOKEN_PLACEHOLDER");
    toast({
      title: "Link copied",
      description: "Survey link copied to clipboard",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share className="mr-2 h-4 w-4" />
          Share Survey
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Survey</DialogTitle>
          <DialogDescription>
            Share this survey with attendees via WhatsApp, SMS, or copy the link.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="whatsapp" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
          </TabsList>
          
          <TabsContent value="whatsapp" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp-number">WhatsApp Number</Label>
              <Input
                id="whatsapp-number"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the phone number with country code
              </p>
            </div>
            
            <Button 
              className="w-full" 
              onClick={() => handleShare("whatsapp")}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send via WhatsApp
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="sms" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sms-number">Phone Number</Label>
              <Input
                id="sms-number"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the phone number with country code
              </p>
            </div>
            
            <Button 
              className="w-full" 
              onClick={() => handleShare("sms")}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send via SMS
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
        
        <div className="mt-4">
          <Label htmlFor="survey-link">Or copy the survey link</Label>
          <div className="mt-2 flex items-center space-x-2">
            <Input
              id="survey-link"
              value={surveyUrl + "SURVEY_TOKEN_PLACEHOLDER"}
              readOnly
            />
            <Button size="icon" variant="outline" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Note: This link requires a valid token to access the survey
          </p>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
