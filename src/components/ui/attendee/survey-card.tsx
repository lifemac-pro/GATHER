"use client";

import { FileText, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SurveyCardProps {
  id: string;
  eventName: string;
  eventDate: Date;
  completed: boolean;
  dueDate?: Date;
  onClick: () => void;
}

export function SurveyCard({
  id,
  eventName,
  eventDate,
  completed,
  dueDate,
  onClick,
}: SurveyCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-bold text-[#E1A913]">
            {eventName}
          </CardTitle>
          {completed ? (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              <CheckCircle className="mr-1 h-3 w-3" />
              Completed
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
              <Clock className="mr-1 h-3 w-3" />
              Pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-[#B0B8C5]">
            <FileText className="mr-2 h-4 w-4 text-[#00b0a6]" />
            <span>Event Date: {formatDate(eventDate)}</span>
          </div>
          {dueDate && !completed && (
            <div className="text-[#B0B8C5]">
              <span className="font-medium">Due by: </span>
              {formatDate(dueDate)}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onClick}
          variant={completed ? "outline" : "default"}
          className={completed 
            ? "w-full border-[#00b0a6] text-[#00b0a6] hover:bg-[#00b0a6]/10" 
            : "w-full bg-[#00b0a6] text-white hover:bg-[#00b0a6]/90"
          }
        >
          {completed ? "View Responses" : "Take Survey"}
        </Button>
      </CardFooter>
    </Card>
  );
}
