import { useCallback } from 'react';
import { useApi, useMutation } from './use-api';
import { api } from '@/lib/api-client';
import { EventResponse, EventListResponse } from '@/types/api-responses';
import { CreateEventRequest, UpdateEventRequest } from '@/types/api-requests';

/**
 * Hook for fetching events
 */
export function useEvents(params?: {
  page?: number;
  limit?: number;
  category?: string;
  featured?: boolean;
  upcoming?: boolean;
}) {
  return useApi<EventListResponse>(
    () => api.events.getAll<EventListResponse>(params),
    {
      deps: [params?.page, params?.limit, params?.category, params?.featured, params?.upcoming],
    }
  );
}

/**
 * Hook for fetching a single event
 */
export function useEvent(id: string) {
  return useApi<EventResponse>(
    () => api.events.getById<EventResponse>(id),
    {
      deps: [id],
    }
  );
}

/**
 * Hook for creating an event
 */
export function useCreateEvent() {
  return useMutation<EventResponse, CreateEventRequest>(
    (data) => api.events.create<EventResponse>(data)
  );
}

/**
 * Hook for updating an event
 */
export function useUpdateEvent() {
  return useMutation<EventResponse, { id: string } & UpdateEventRequest>(
    (data) => {
      const { id, ...updateData } = data;
      return api.events.update<EventResponse>(id, updateData);
    }
  );
}

/**
 * Hook for deleting an event
 */
export function useDeleteEvent() {
  return useMutation<{ success: boolean }, string>(
    (id) => api.events.delete<{ success: boolean }>(id)
  );
}

/**
 * Hook for managing events (CRUD operations)
 */
export function useEventManager() {
  const { data: events, isLoading: isLoadingEvents, refetch: refetchEvents, ...eventsRest } = useEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  
  const handleCreate = useCallback(async (data: CreateEventRequest) => {
    const result = await createEvent.mutate(data);
    await refetchEvents();
    return result;
  }, [createEvent, refetchEvents]);
  
  const handleUpdate = useCallback(async (id: string, data: UpdateEventRequest) => {
    const result = await updateEvent.mutate({ id, ...data });
    await refetchEvents();
    return result;
  }, [updateEvent, refetchEvents]);
  
  const handleDelete = useCallback(async (id: string) => {
    const result = await deleteEvent.mutate(id);
    await refetchEvents();
    return result;
  }, [deleteEvent, refetchEvents]);
  
  return {
    events: events?.items || [],
    isLoading: isLoadingEvents || createEvent.isLoading || updateEvent.isLoading || deleteEvent.isLoading,
    create: handleCreate,
    update: handleUpdate,
    delete: handleDelete,
    refetch: refetchEvents,
    ...eventsRest,
    createError: createEvent.error,
    updateError: updateEvent.error,
    deleteError: deleteEvent.error,
  };
}
