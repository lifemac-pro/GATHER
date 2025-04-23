"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EventList } from '@/components/events/event-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth-context';

export default function EventsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  // Get initial values from URL
  const initialCategory = searchParams.get('category') || '';
  const initialTab = searchParams.get('tab') || 'all';

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'featured'>(initialTab as any || 'all');
  const [refreshKey, setRefreshKey] = useState(0); // Add a refresh key state

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL with search params
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (category) params.set('category', category);
    params.set('tab', activeTab);

    router.push(`/events?${params.toString()}`);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'all' | 'upcoming' | 'featured');

    // Update URL with tab
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);
    router.push(`/events?${params.toString()}`);
  };

  // Handle category change
  const handleCategoryChange = (value: string) => {
    setCategory(value);

    // Update URL with category
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('category', value);
    } else {
      params.delete('category');
    }
    router.push(`/events?${params.toString()}`);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Events</h1>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              console.log('Refreshing events page');
              // Increment refresh key to trigger re-fetch
              setRefreshKey(prev => prev + 1);
              // Force a router refresh
              router.refresh();
              // Show a toast notification
              toast({
                title: "Refreshing events",
                description: "Fetching the latest events from the database..."
              });
            }}
          >
            Refresh Events
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push('/debug-events')}
          >
            Debug Events
          </Button>

          {user && (
            <Button onClick={() => router.push('/events/create')}>
              Create Event
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full md:w-64">
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="tech">Technology</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit">Search</Button>
        </form>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <EventList category={category} refreshKey={refreshKey} />
        </TabsContent>

        <TabsContent value="upcoming">
          <EventList category={category} upcoming={true} refreshKey={refreshKey} />
        </TabsContent>

        <TabsContent value="featured">
          <EventList category={category} featured={true} refreshKey={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
