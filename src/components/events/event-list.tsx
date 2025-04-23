"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { EventCard } from "./event-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface EventListProps {
  category?: string;
  upcoming?: boolean;
  featured?: boolean;
  refreshKey?: number;
}

export function EventList({
  category,
  upcoming,
  featured,
  refreshKey = 0,
}: EventListProps = {}) {
  const [page, setPage] = useState(1);
  // No longer using manual API calls

  // Get categories for filtering
  const { data: categories } = api.event.getCategories.useQuery();

  // Choose the appropriate query based on props
  const {
    data: allData,
    isLoading,
    error,
  } = featured
    ? api.event.getFeatured.useQuery()
    : upcoming
      ? api.event.getUpcoming.useQuery()
      : api.event.getAll.useQuery();

  // Force a refetch when refreshKey changes or on component mount
  useEffect(() => {
    console.log("Refreshing events with refreshKey:", refreshKey);
    // Invalidate the queries to force a refetch
    const utils = api.useUtils();
    if (featured) {
      utils.event.getFeatured.invalidate();
    } else if (upcoming) {
      utils.event.getUpcoming.invalidate();
    } else {
      utils.event.getAll.invalidate();
    }
  }, [refreshKey, featured, upcoming]);

  // Enhanced debugging for events data
  console.log("Events data received:", allData ? "Yes" : "No");
  console.log("Events count:", allData?.length || 0);
  console.log("Loading state:", isLoading ? "Loading" : "Completed");
  console.log("Error state:", error ? `Error: ${error.message}` : "No errors");

  // Log event details for debugging
  if (allData && allData.length > 0) {
    console.log("First event details:", {
      id: allData[0].id,
      name: allData[0].name,
      category: allData[0].category,
      createdById: allData[0].createdById,
      image: allData[0].image
        ? allData[0].image.length > 50
          ? allData[0].image.substring(0, 50) + "..."
          : allData[0].image
        : "No image",
    });
  }

  // Use TRPC data only
  const eventsData = allData || [];
  console.log("TRPC events count:", eventsData.length);

  // Get search params for filtering
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const categoryParam = searchParams.get("category") || category || "";
  const locationParam = searchParams.get("location") || "";
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const featuredParam = searchParams.get("featured") === "true" || featured;

  // Apply all filters
  const filteredData =
    eventsData.length > 0
      ? eventsData.filter((event) => {
          // Category filter
          if (categoryParam && event.category !== categoryParam) return false;

          // Search term filter (search in name and description)
          if (
            searchTerm &&
            !(
              event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (event.description?.toLowerCase().includes(searchTerm.toLowerCase()))
            )
          )
            return false;

          // Location filter
          if (
            locationParam &&
            !(
              event.location?.toLowerCase().includes(locationParam.toLowerCase())
            )
          )
            return false;

          // Date range filters
          if (startDateParam) {
            const startDate = new Date(startDateParam);
            if (new Date(event.endDate) < startDate) return false;
          }

          if (endDateParam) {
            const endDate = new Date(endDateParam);
            if (new Date(event.startDate) > endDate) return false;
          }

          // Price range filters
          if (minPriceParam && event.price < parseInt(minPriceParam))
            return false;
          if (maxPriceParam && event.price > parseInt(maxPriceParam))
            return false;

          // Featured filter (only if explicitly requested)
          if (featuredParam && !event.featured) return false;

          return true;
        })
      : [];

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading events..." />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
        <p>Error loading events:</p>
        <p className="mt-2">{error.message}</p>
      </div>
    );
  }

  // Add more detailed logging about the data
  console.log("Filtered data length:", filteredData?.length);
  console.log("Category filter applied:", categoryParam || "none");
  console.log("Search term applied:", searchTerm || "none");
  console.log("Location filter applied:", locationParam || "none");
  console.log(
    "View type:",
    featured ? "featured" : upcoming ? "upcoming" : "all",
  );

  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="rounded-lg border border-muted p-8 text-center">
        <h3 className="mb-2 text-lg font-semibold">No events found</h3>
        <p className="text-muted-foreground">
          There are no events available at the moment.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Debug info:{" "}
          {allData ? `${allData.length} events from TRPC` : "No data from TRPC"}
          {categoryParam ? `, filtered by category: ${categoryParam}` : ""}
          {searchTerm ? `, search term: ${searchTerm}` : ""}
          {error ? `, Error: ${error.message}` : ""}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Events data: {eventsData.length} events, Filtered data:{" "}
          {filteredData.length} events
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredData.map((event) => (
          <EventCard
            key={event.id}
            id={event.id}
            name={event.name}
            description={event.description}
            location={event.location}
            startDate={new Date(event.startDate)}
            endDate={new Date(event.endDate)}
            category={event.category}
            price={event.price}
            image={event.image}
            attendeeCount={event.maxAttendees?.length || 0}
          />
        ))}
      </div>

      {filteredData.length > 0 && filteredData.length >= 8 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => handlePageChange(page + 1)}
            className="mx-auto"
          >
            Load More Events
          </Button>
        </div>
      )}
    </div>
  );
}
