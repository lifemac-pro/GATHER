"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Check, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SurveyResponseTrackerProps {
  surveyId: string;
  eventId: string;
}

export function SurveyResponseTracker({ surveyId, eventId }: SurveyResponseTrackerProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get survey response stats
  const { data: stats, isLoading, refetch } = api.survey.getResponseStats.useQuery({
    surveyId,
    eventId,
  });
  
  // Refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      void refetch();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refetch]);
  
  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center py-6">
            <LoadingSpinner size="md" text="Loading response data..." />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground" />
            <p>Unable to load response data</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const responseRate = stats.totalResponses > 0 
    ? Math.round((stats.totalResponses / stats.totalSent) * 100) 
    : 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Response Tracking</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <LoadingSpinner size="sm" className="mr-1" />
          ) : (
            <RefreshCw className="mr-1 h-4 w-4" />
          )}
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Response Rate</span>
              <span className="font-medium">{responseRate}%</span>
            </div>
            <Progress value={responseRate} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md border p-3">
              <div className="flex items-center space-x-2">
                <div className="rounded-full bg-primary/10 p-1">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">Completed</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{stats.totalResponses}</p>
            </div>
            
            <div className="rounded-md border p-3">
              <div className="flex items-center space-x-2">
                <div className="rounded-full bg-amber-500/10 p-1">
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <span className="text-sm font-medium">Pending</span>
              </div>
              <p className="mt-2 text-2xl font-bold">{stats.totalSent - stats.totalResponses}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Status</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Sent</span>
                <Badge variant="outline">{stats.totalSent}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Opened</span>
                <Badge variant="outline">{stats.opened}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Completed</span>
                <Badge variant="outline">{stats.totalResponses}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Rating</span>
                <Badge variant="outline">{stats.avgRating.toFixed(1)}</Badge>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
