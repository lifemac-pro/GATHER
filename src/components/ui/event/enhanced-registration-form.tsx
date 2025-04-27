"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/components/ui/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Define the form schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  demographics: z
    .object({
      age: z.number().min(0).max(120).optional(),
      dateOfBirth: z.date().optional(),
      gender: z
        .enum(["male", "female", "non-binary", "prefer-not-to-say", "other"])
        .optional(),
      genderOther: z.string().optional(),
      country: z.string().optional(),
      city: z.string().optional(),
      occupation: z.string().optional(),
      industry: z.string().optional(),
      interests: z.array(z.string()).optional(),
      dietaryRestrictions: z.array(z.string()).optional(),
      accessibilityNeeds: z.array(z.string()).optional(),
      howHeard: z.string().optional(),
      languages: z.array(z.string()).optional(),
      educationLevel: z
        .enum([
          "high-school",
          "bachelors",
          "masters",
          "doctorate",
          "other",
          "prefer-not-to-say",
        ])
        .optional(),
    })
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

// Define the interests options
const interestsOptions = [
  { id: "technology", label: "Technology" },
  { id: "business", label: "Business" },
  { id: "marketing", label: "Marketing" },
  { id: "design", label: "Design" },
  { id: "education", label: "Education" },
  { id: "health", label: "Health & Wellness" },
  { id: "science", label: "Science" },
  { id: "arts", label: "Arts & Culture" },
  { id: "environment", label: "Environment" },
  { id: "social-impact", label: "Social Impact" },
];

// Define the dietary restrictions options
const dietaryOptions = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Gluten-Free" },
  { id: "dairy-free", label: "Dairy-Free" },
  { id: "nut-allergy", label: "Nut Allergy" },
  { id: "kosher", label: "Kosher" },
  { id: "halal", label: "Halal" },
];

// Define the accessibility needs options
const accessibilityOptions = [
  { id: "wheelchair", label: "Wheelchair Access" },
  { id: "sign-language", label: "Sign Language Interpreter" },
  { id: "closed-captioning", label: "Closed Captioning" },
  { id: "large-print", label: "Large Print Materials" },
  { id: "assistive-listening", label: "Assistive Listening Device" },
  { id: "service-animal", label: "Service Animal Accommodation" },
];

// Define the languages options
const languageOptions = [
  { id: "english", label: "English" },
  { id: "spanish", label: "Spanish" },
  { id: "french", label: "French" },
  { id: "german", label: "German" },
  { id: "chinese", label: "Chinese" },
  { id: "japanese", label: "Japanese" },
  { id: "arabic", label: "Arabic" },
  { id: "hindi", label: "Hindi" },
  { id: "portuguese", label: "Portuguese" },
  { id: "russian", label: "Russian" },
];

// Define the industries options
const industryOptions = [
  { id: "technology", label: "Technology" },
  { id: "healthcare", label: "Healthcare" },
  { id: "finance", label: "Finance" },
  { id: "education", label: "Education" },
  { id: "retail", label: "Retail" },
  { id: "manufacturing", label: "Manufacturing" },
  { id: "media", label: "Media & Entertainment" },
  { id: "government", label: "Government" },
  { id: "nonprofit", label: "Nonprofit" },
  { id: "other", label: "Other" },
];

interface EnhancedRegistrationFormProps {
  eventId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  isPaid?: boolean;
}

export function EnhancedRegistrationForm({
  eventId,
  onSuccess,
  onCancel,
  isPaid = false,
}: EnhancedRegistrationFormProps) {
  const { toast } = useToast();
  const { isSignedIn, user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDemographics, setShowDemographics] = useState(false);

  // Get the event details
  const { data: event, isLoading: isLoadingEvent } = api.event.getById.useQuery(
    { id: eventId },
    { enabled: !!eventId },
  );

  // Registration mutation
  const register = api.attendee.register.useMutation({
    onSuccess: () => {
      toast({
        title: "Registration successful",
        description: "You have successfully registered for this event.",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to register for this event",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.fullName || "",
      email: user?.primaryEmailAddress?.emailAddress || "",
      phone: user?.phoneNumbers?.[0]?.phoneNumber || "",
      demographics: {
        gender: undefined,
        country: "",
        city: "",
        occupation: "",
        industry: undefined,
        interests: [],
        dietaryRestrictions: [],
        accessibilityNeeds: [],
        howHeard: "",
        languages: [],
        educationLevel: undefined,
      },
    },
  });

  // Update form values when user data is loaded
  React.useEffect(() => {
    if (user) {
      form.setValue("name", user.fullName || "");
      form.setValue("email", user.primaryEmailAddress?.emailAddress || "");
      form.setValue("phone", user.phoneNumbers?.[0]?.phoneNumber || "");
    }
  }, [user, form]);

  // Form submission
  const onSubmit = async (data: FormData) => {
    if (!isSignedIn) {
      toast({
        title: "Sign in required",
        description: "Please sign in to register for this event",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await register.mutateAsync({
        eventId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        demographics: data.demographics,
      });
    } catch (error) {
      console.error("Error registering for event:", error);
      setIsSubmitting(false);
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner size="lg" text="Loading event details..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Event not found</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Registration Information</h2>
          <p className="text-sm text-muted-foreground">
            Please provide your information to register for {event.name}
          </p>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="john.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 123-4567" {...field} />
                </FormControl>
                <FormDescription>
                  We'll use this to send you important updates about the event
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Accordion
          type="single"
          collapsible
          value={showDemographics ? "demographics" : ""}
          onValueChange={(value) =>
            setShowDemographics(value === "demographics")
          }
        >
          <AccordionItem value="demographics">
            <AccordionTrigger className="text-lg font-medium">
              Demographic Information (Optional)
            </AccordionTrigger>
            <AccordionContent className="space-y-6 pt-4">
              <p className="text-sm text-muted-foreground">
                This information helps us better understand our audience and
                improve future events. All demographic information is optional
                and will be kept confidential.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="demographics.age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={120}
                          placeholder="30"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(
                              value === "" ? undefined : parseInt(value, 10),
                            );
                          }}
                          value={field.value === undefined ? "" : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="demographics.dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Birth</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
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
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="demographics.gender"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Gender</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="male" />
                          </FormControl>
                          <FormLabel className="font-normal">Male</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="female" />
                          </FormControl>
                          <FormLabel className="font-normal">Female</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="non-binary" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Non-binary
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="prefer-not-to-say" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Prefer not to say
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="other" />
                          </FormControl>
                          <FormLabel className="font-normal">Other</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("demographics.gender") === "other" && (
                <FormField
                  control={form.control}
                  name="demographics.genderOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Please specify</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="demographics.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="demographics.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="demographics.occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupation</FormLabel>
                      <FormControl>
                        <Input placeholder="Software Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="demographics.industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {industryOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="demographics.educationLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Education Level</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your highest education level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high-school">High School</SelectItem>
                        <SelectItem value="bachelors">
                          Bachelor's Degree
                        </SelectItem>
                        <SelectItem value="masters">Master's Degree</SelectItem>
                        <SelectItem value="doctorate">Doctorate</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">
                          Prefer not to say
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="demographics.interests"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Interests</FormLabel>
                      <FormDescription>Select all that apply</FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                      {interestsOptions.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="demographics.interests"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValues = field.value || [];
                                      return checked
                                        ? field.onChange([
                                            ...currentValues,
                                            item.id,
                                          ])
                                        : field.onChange(
                                            currentValues.filter(
                                              (value) => value !== item.id,
                                            ),
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="demographics.dietaryRestrictions"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">
                        Dietary Restrictions
                      </FormLabel>
                      <FormDescription>Select all that apply</FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                      {dietaryOptions.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="demographics.dietaryRestrictions"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValues = field.value || [];
                                      return checked
                                        ? field.onChange([
                                            ...currentValues,
                                            item.id,
                                          ])
                                        : field.onChange(
                                            currentValues.filter(
                                              (value) => value !== item.id,
                                            ),
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="demographics.accessibilityNeeds"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">
                        Accessibility Needs
                      </FormLabel>
                      <FormDescription>Select all that apply</FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                      {accessibilityOptions.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="demographics.accessibilityNeeds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValues = field.value || [];
                                      return checked
                                        ? field.onChange([
                                            ...currentValues,
                                            item.id,
                                          ])
                                        : field.onChange(
                                            currentValues.filter(
                                              (value) => value !== item.id,
                                            ),
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="demographics.languages"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">
                        Languages Spoken
                      </FormLabel>
                      <FormDescription>Select all that apply</FormDescription>
                    </div>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                      {languageOptions.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="demographics.languages"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValues = field.value || [];
                                      return checked
                                        ? field.onChange([
                                            ...currentValues,
                                            item.id,
                                          ])
                                        : field.onChange(
                                            currentValues.filter(
                                              (value) => value !== item.id,
                                            ),
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {item.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="demographics.howHeard"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How did you hear about this event?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Social media, friend, email, etc."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex justify-end space-x-4 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Registering...
              </>
            ) : (
              <>Register{isPaid ? " & Proceed to Payment" : ""}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
