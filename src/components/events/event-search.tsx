"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { api } from "@/trpc/react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function EventSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get categories for filtering
  const { data: categories } = api.event.getCategories.useQuery();

  // Search state
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || "",
  );
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined,
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined,
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([
    parseInt(searchParams.get("minPrice") || "0"),
    parseInt(searchParams.get("maxPrice") || "1000"),
  ]);
  const [featured, setFeatured] = useState(
    searchParams.get("featured") === "true",
  );
  const [upcoming, setUpcoming] = useState(
    searchParams.get("upcoming") === "true" || true,
  );

  // Active filters count
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Update active filters count
  useEffect(() => {
    let count = 0;
    if (category) count++;
    if (location) count++;
    if (startDate) count++;
    if (endDate) count++;
    if (priceRange[0] > 0 || priceRange[1] < 1000) count++;
    if (featured) count++;

    setActiveFiltersCount(count);
  }, [category, location, startDate, endDate, priceRange, featured]);

  // Use the search procedure directly
  const { data: searchResults, isLoading: isSearching } =
    api.event.search.useQuery(
      {
        search: searchTerm,
        category: category,
        location: location,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 1000 ? priceRange[1] : undefined,
        featured: featured || undefined,
        upcoming: upcoming || undefined,
      },
      {
        enabled: false, // Don't run automatically
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    );

  // Handle search
  const handleSearch = () => {
    const params = new URLSearchParams();

    if (searchTerm) params.set("search", searchTerm);
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    if (startDate) params.set("startDate", startDate.toISOString());
    if (endDate) params.set("endDate", endDate.toISOString());
    if (priceRange[0] > 0) params.set("minPrice", priceRange[0].toString());
    if (priceRange[1] < 1000) params.set("maxPrice", priceRange[1].toString());
    if (featured) params.set("featured", "true");
    if (upcoming) params.set("upcoming", "true");

    router.push(`/events?${params.toString()}`);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setCategory("");
    setLocation("");
    setStartDate(undefined);
    setEndDate(undefined);
    setPriceRange([0, 1000]);
    setFeatured(false);
    setUpcoming(true);

    router.push("/events");
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>

        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 sm:w-96">
              <div className="space-y-4">
                <h4 className="font-medium">Filter Events</h4>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.name} value={cat.name}>
                          {cat.name} ({cat.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Any location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {startDate ? format(startDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {endDate ? format(endDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                          disabled={(date) =>
                            startDate ? date < startDate : false
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Price Range</Label>
                    <span className="text-sm text-muted-foreground">
                      ${priceRange[0]} - ${priceRange[1]}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[0, 1000]}
                    min={0}
                    max={1000}
                    step={10}
                    value={priceRange}
                    onValueChange={(value) =>
                      setPriceRange(value as [number, number])
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={featured}
                    onCheckedChange={setFeatured}
                  />
                  <Label htmlFor="featured">Featured Events Only</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="upcoming"
                    checked={upcoming}
                    onCheckedChange={setUpcoming}
                  />
                  <Label htmlFor="upcoming">Upcoming Events Only</Label>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                  <Button size="sm" onClick={handleSearch}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>

      {/* Active filters display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {category}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setCategory("");
                  handleSearch();
                }}
              />
            </Badge>
          )}

          {location && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Location: {location}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setLocation("");
                  handleSearch();
                }}
              />
            </Badge>
          )}

          {startDate && (
            <Badge variant="secondary" className="flex items-center gap-1">
              From: {format(startDate, "PP")}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setStartDate(undefined);
                  handleSearch();
                }}
              />
            </Badge>
          )}

          {endDate && (
            <Badge variant="secondary" className="flex items-center gap-1">
              To: {format(endDate, "PP")}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setEndDate(undefined);
                  handleSearch();
                }}
              />
            </Badge>
          )}

          {(priceRange[0] > 0 || priceRange[1] < 1000) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Price: ${priceRange[0]} - ${priceRange[1]}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setPriceRange([0, 1000]);
                  handleSearch();
                }}
              />
            </Badge>
          )}

          {featured && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Featured Only
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  setFeatured(false);
                  handleSearch();
                }}
              />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={clearFilters}
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
