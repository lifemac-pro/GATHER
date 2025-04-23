"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Users,
  Globe,
  Briefcase,
  Languages,
  Utensils,
  Accessibility,
} from "lucide-react";

// Define chart colors
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FF6B6B",
  "#6A7FDB",
  "#61DAFB",
  "#F06292",
];

interface DemographicsAnalyticsProps {
  eventId: string;
}

export function DemographicsAnalytics({ eventId }: DemographicsAnalyticsProps) {
  const [activeTab, setActiveTab] = useState("gender");

  // Fetch attendees with demographic information
  const { data: attendees, isLoading } = api.attendee.getByEvent.useQuery(
    { eventId, includeDemographics: true },
    { enabled: !!eventId },
  );

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner size="lg" text="Loading demographic data..." />
      </div>
    );
  }

  if (!attendees || attendees.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Demographics</CardTitle>
          <CardDescription>
            No attendee data available for demographic analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="mb-2 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              Once attendees register with demographic information, you'll see
              analytics here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Process demographic data
  const attendeesWithDemographics = attendees.filter(
    (attendee) => attendee.demographics,
  );

  // Gender distribution
  const genderData = processGenderData(attendeesWithDemographics);

  // Age distribution
  const ageData = processAgeData(attendeesWithDemographics);

  // Location distribution
  const locationData = processLocationData(attendeesWithDemographics);

  // Industry distribution
  const industryData = processIndustryData(attendeesWithDemographics);

  // Languages distribution
  const languageData = processLanguageData(attendeesWithDemographics);

  // Dietary restrictions
  const dietaryData = processDietaryData(attendeesWithDemographics);

  // Accessibility needs
  const accessibilityData = processAccessibilityData(attendeesWithDemographics);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demographics</CardTitle>
        <CardDescription>
          Demographic breakdown of event attendees
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7">
            <TabsTrigger value="gender">Gender</TabsTrigger>
            <TabsTrigger value="age">Age</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="industry">Industry</TabsTrigger>
            <TabsTrigger value="languages">Languages</TabsTrigger>
            <TabsTrigger value="dietary">Dietary</TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          </TabsList>

          <TabsContent value="gender" className="pt-4">
            <div className="flex flex-col items-center">
              <h3 className="mb-4 text-lg font-medium">Gender Distribution</h3>
              {genderData.length > 0 ? (
                <div className="h-[300px] w-full max-w-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {genderData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [
                          `${value} attendees`,
                          name,
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No gender data available
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="age" className="pt-4">
            <div className="flex flex-col items-center">
              <h3 className="mb-4 text-lg font-medium">Age Distribution</h3>
              {ageData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={ageData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" name="Attendees" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground">No age data available</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="location" className="pt-4">
            <div className="flex flex-col items-center">
              <h3 className="mb-4 text-lg font-medium">
                Location Distribution
              </h3>
              {locationData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={locationData}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 30,
                        left: 100,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#82ca9d" name="Attendees" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No location data available
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="industry" className="pt-4">
            <div className="flex flex-col items-center">
              <h3 className="mb-4 text-lg font-medium">
                Industry Distribution
              </h3>
              {industryData.length > 0 ? (
                <div className="h-[300px] w-full max-w-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={industryData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {industryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [
                          `${value} attendees`,
                          name,
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No industry data available
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="languages" className="pt-4">
            <div className="flex flex-col items-center">
              <h3 className="mb-4 text-lg font-medium">Languages Spoken</h3>
              {languageData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={languageData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#6A7FDB" name="Attendees" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No language data available
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="dietary" className="pt-4">
            <div className="flex flex-col items-center">
              <h3 className="mb-4 text-lg font-medium">Dietary Restrictions</h3>
              {dietaryData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dietaryData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#FF8042" name="Attendees" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No dietary restriction data available
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="accessibility" className="pt-4">
            <div className="flex flex-col items-center">
              <h3 className="mb-4 text-lg font-medium">Accessibility Needs</h3>
              {accessibilityData.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={accessibilityData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#F06292" name="Attendees" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No accessibility needs data available
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper functions to process demographic data

function processGenderData(attendees: any[]) {
  const genderCounts: Record<string, number> = {};

  attendees.forEach((attendee) => {
    if (attendee.demographics?.gender) {
      const gender =
        attendee.demographics.gender === "other" &&
        attendee.demographics.genderOther
          ? attendee.demographics.genderOther
          : formatLabel(attendee.demographics.gender);

      genderCounts[gender] = (genderCounts[gender] || 0) + 1;
    }
  });

  return Object.entries(genderCounts).map(([name, value]) => ({ name, value }));
}

function processAgeData(attendees: any[]) {
  const ageRanges = {
    "Under 18": 0,
    "18-24": 0,
    "25-34": 0,
    "35-44": 0,
    "45-54": 0,
    "55-64": 0,
    "65+": 0,
  };

  attendees.forEach((attendee) => {
    if (attendee.demographics?.age) {
      const age = attendee.demographics.age;

      if (age < 18) ageRanges["Under 18"]++;
      else if (age < 25) ageRanges["18-24"]++;
      else if (age < 35) ageRanges["25-34"]++;
      else if (age < 45) ageRanges["35-44"]++;
      else if (age < 55) ageRanges["45-54"]++;
      else if (age < 65) ageRanges["55-64"]++;
      else ageRanges["65+"]++;
    }
  });

  return Object.entries(ageRanges).map(([name, value]) => ({ name, value }));
}

function processLocationData(attendees: any[]) {
  const locationCounts: Record<string, number> = {};

  attendees.forEach((attendee) => {
    if (attendee.demographics?.country) {
      const location = attendee.demographics.country;
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    }
  });

  return Object.entries(locationCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 locations
}

function processIndustryData(attendees: any[]) {
  const industryCounts: Record<string, number> = {};

  attendees.forEach((attendee) => {
    if (attendee.demographics?.industry) {
      const industry = formatLabel(attendee.demographics.industry);
      industryCounts[industry] = (industryCounts[industry] || 0) + 1;
    }
  });

  return Object.entries(industryCounts).map(([name, value]) => ({
    name,
    value,
  }));
}

function processLanguageData(attendees: any[]) {
  const languageCounts: Record<string, number> = {};

  attendees.forEach((attendee) => {
    if (
      attendee.demographics?.languages &&
      attendee.demographics.languages.length > 0
    ) {
      attendee.demographics.languages.forEach((lang: string) => {
        const language = formatLabel(lang);
        languageCounts[language] = (languageCounts[language] || 0) + 1;
      });
    }
  });

  return Object.entries(languageCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 languages
}

function processDietaryData(attendees: any[]) {
  const dietaryCounts: Record<string, number> = {};

  attendees.forEach((attendee) => {
    if (
      attendee.demographics?.dietaryRestrictions &&
      attendee.demographics.dietaryRestrictions.length > 0
    ) {
      attendee.demographics.dietaryRestrictions.forEach(
        (restriction: string) => {
          const dietary = formatLabel(restriction);
          dietaryCounts[dietary] = (dietaryCounts[dietary] || 0) + 1;
        },
      );
    }
  });

  return Object.entries(dietaryCounts).map(([name, value]) => ({
    name,
    value,
  }));
}

function processAccessibilityData(attendees: any[]) {
  const accessibilityCounts: Record<string, number> = {};

  attendees.forEach((attendee) => {
    if (
      attendee.demographics?.accessibilityNeeds &&
      attendee.demographics.accessibilityNeeds.length > 0
    ) {
      attendee.demographics.accessibilityNeeds.forEach((need: string) => {
        const accessibility = formatLabel(need);
        accessibilityCounts[accessibility] =
          (accessibilityCounts[accessibility] || 0) + 1;
      });
    }
  });

  return Object.entries(accessibilityCounts).map(([name, value]) => ({
    name,
    value,
  }));
}

// Helper function to format labels
function formatLabel(str: string): string {
  return str
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
