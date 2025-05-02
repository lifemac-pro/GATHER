"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Video, Link, Key, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { useToast } from "@/components/ui/use-toast";

// Define the form schema
const formSchema = z.object({
  platform: z.enum(["zoom", "google-meet", "teams", "other"]),
  topic: z.string().min(1, "Topic is required"),
  description: z.string().optional(),
  startTime: z.date({
    required_error: "Start time is required",
  }),
  duration: z.coerce.number().int().min(1, "Duration must be at least 1 minute"),
  timezone: z.string().optional(),
  password: z.string().optional(),
  meetingUrl: z.string().url().optional().or(z.literal("")),
  hostVideo: z.boolean().default(true),
  participantVideo: z.boolean().default(true),
  joinBeforeHost: z.boolean().default(false),
  muteUponEntry: z.boolean().default(true),
  waitingRoom: z.boolean().default(true),
  recording: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface VideoConferenceFormProps {
  eventId?: string;
  initialData?: {
    platform: "zoom" | "google-meet" | "teams" | "other";
    meetingUrl?: string;
    meetingId?: string;
    password?: string;
  };
  onSuccess?: (meetingDetails: any) => void;
}

export function VideoConferenceForm({ eventId, initialData, onSuccess }: VideoConferenceFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>(initialData?.platform || "zoom");
  
  // Check platform configuration
  const { data: zoomConfig } = api.videoConferencing.isPlatformConfigured.useQuery(
    { platform: "zoom" },
    { enabled: selectedPlatform === "zoom" }
  );
  
  const { data: googleMeetConfig } = api.videoConferencing.isPlatformConfigured.useQuery(
    { platform: "google-meet" },
    { enabled: selectedPlatform === "google-meet" }
  );
  
  const { data: teamsConfig } = api.videoConferencing.isPlatformConfigured.useQuery(
    { platform: "teams" },
    { enabled: selectedPlatform === "teams" }
  );
  
  // Create meeting mutation
  const createMeetingMutation = api.videoConferencing.createMeeting.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Video conference created successfully",
      });
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create video conference",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });
  
  // Update meeting mutation
  const updateMeetingMutation = api.videoConferencing.updateMeeting.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Video conference updated successfully",
      });
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update video conference",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      platform: initialData?.platform || "zoom",
      topic: "",
      description: "",
      startTime: new Date(),
      duration: 60,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      password: initialData?.password || "",
      meetingUrl: initialData?.meetingUrl || "",
      hostVideo: true,
      participantVideo: true,
      joinBeforeHost: false,
      muteUponEntry: true,
      waitingRoom: true,
      recording: false,
    },
  });
  
  // Handle platform change
  const handlePlatformChange = (value: string) => {
    setSelectedPlatform(value);
    form.setValue("platform", value as any);
  };
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    
    const meetingData = {
      platform: values.platform,
      topic: values.topic,
      description: values.description,
      startTime: values.startTime,
      duration: values.duration,
      timezone: values.timezone,
      password: values.password,
      settings: {
        hostVideo: values.hostVideo,
        participantVideo: values.participantVideo,
        joinBeforeHost: values.joinBeforeHost,
        muteUponEntry: values.muteUponEntry,
        waitingRoom: values.waitingRoom,
        recording: values.recording,
      },
    };
    
    if (values.platform === "other" && values.meetingUrl) {
      // For manual entry, just return the data
      if (onSuccess) {
        onSuccess({
          platform: "other",
          meetingUrl: values.meetingUrl,
          password: values.password,
        });
      }
      setIsSubmitting(false);
    } else if (initialData?.meetingId) {
      // Update existing meeting
      updateMeetingMutation.mutate({
        ...meetingData,
        meetingId: initialData.meetingId,
      });
    } else {
      // Create new meeting
      createMeetingMutation.mutate(meetingData);
    }
  };
  
  // Check if the selected platform is configured
  const isPlatformConfigured = () => {
    switch (selectedPlatform) {
      case "zoom":
        return zoomConfig?.isConfigured;
      case "google-meet":
        return googleMeetConfig?.isConfigured;
      case "teams":
        return teamsConfig?.isConfigured;
      case "other":
        return true;
      default:
        return false;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Video Conference</CardTitle>
        <CardDescription>
          Create or update a video conference for your event
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={selectedPlatform} onValueChange={handlePlatformChange}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="zoom">Zoom</TabsTrigger>
            <TabsTrigger value="google-meet">Google Meet</TabsTrigger>
            <TabsTrigger value="teams">MS Teams</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
              <TabsContent value="zoom">
                {!zoomConfig?.isConfigured ? (
                  <div className="rounded-md bg-yellow-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Video className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Zoom API not configured</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>Please configure Zoom API credentials in your environment variables.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meeting Topic</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter meeting topic" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter meeting description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Start Time</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP p")
                                    ) : (
                                      <span>Pick a date and time</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                                <div className="border-t p-3">
                                  <Input
                                    type="time"
                                    value={field.value ? format(field.value, "HH:mm") : ""}
                                    onChange={(e) => {
                                      const [hours, minutes] = e.target.value.split(":");
                                      const newDate = new Date(field.value);
                                      newDate.setHours(parseInt(hours, 10));
                                      newDate.setMinutes(parseInt(minutes, 10));
                                      field.onChange(newDate);
                                    }}
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter meeting password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Meeting Settings</h3>
                      <div className="grid gap-2 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="hostVideo"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">Host video on</FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="participantVideo"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">Participant video on</FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="joinBeforeHost"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">Join before host</FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="muteUponEntry"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">Mute upon entry</FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="waitingRoom"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">Waiting room</FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="recording"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">Auto recording</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="google-meet">
                {!googleMeetConfig?.isConfigured ? (
                  <div className="rounded-md bg-yellow-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Video className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Google Meet API not configured</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>Please configure Google Meet API credentials in your environment variables.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meeting Topic</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter meeting topic" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter meeting description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Start Time</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP p")
                                    ) : (
                                      <span>Pick a date and time</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                                <div className="border-t p-3">
                                  <Input
                                    type="time"
                                    value={field.value ? format(field.value, "HH:mm") : ""}
                                    onChange={(e) => {
                                      const [hours, minutes] = e.target.value.split(":");
                                      const newDate = new Date(field.value);
                                      newDate.setHours(parseInt(hours, 10));
                                      newDate.setMinutes(parseInt(minutes, 10));
                                      field.onChange(newDate);
                                    }}
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="teams">
                {!teamsConfig?.isConfigured ? (
                  <div className="rounded-md bg-yellow-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Video className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Microsoft Teams API not configured</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>Please configure Microsoft Teams API credentials in your environment variables.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meeting Topic</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter meeting topic" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Start Time</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP p")
                                    ) : (
                                      <span>Pick a date and time</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                                <div className="border-t p-3">
                                  <Input
                                    type="time"
                                    value={field.value ? format(field.value, "HH:mm") : ""}
                                    onChange={(e) => {
                                      const [hours, minutes] = e.target.value.split(":");
                                      const newDate = new Date(field.value);
                                      newDate.setHours(parseInt(hours, 10));
                                      newDate.setMinutes(parseInt(minutes, 10));
                                      field.onChange(newDate);
                                    }}
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input type="number" min={1} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="other">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="meetingUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting URL</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Link className="mr-2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="https://example.com/meeting" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Enter the URL for your video conference
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password (optional)</FormLabel>
                        <FormControl>
                          <div className="flex items-center">
                            <Key className="mr-2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Enter meeting password" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Enter the password for your video conference if required
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Topic</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter meeting topic" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Time</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP p")
                                  ) : (
                                    <span>Pick a date and time</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                              <div className="border-t p-3">
                                <Input
                                  type="time"
                                  value={field.value ? format(field.value, "HH:mm") : ""}
                                  onChange={(e) => {
                                    const [hours, minutes] = e.target.value.split(":");
                                    const newDate = new Date(field.value);
                                    newDate.setHours(parseInt(hours, 10));
                                    newDate.setMinutes(parseInt(minutes, 10));
                                    field.onChange(newDate);
                                  }}
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                              <Input type="number" min={1} {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <Button 
                type="submit" 
                disabled={isSubmitting || (selectedPlatform !== "other" && !isPlatformConfigured())}
                className="w-full"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData?.meetingId ? "Update Meeting" : "Create Meeting"}
              </Button>
            </form>
          </Form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
