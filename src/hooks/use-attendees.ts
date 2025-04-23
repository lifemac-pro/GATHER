import { useCallback } from "react";
import { useApi, useMutation } from "./use-api";
import { api } from "@/lib/api-client";
import { type AttendeeResponse, type AttendeeListResponse } from "@/types/api-responses";
import {
  type RegisterForEventRequest,
  type CheckInAttendeeRequest,
  type CancelRegistrationRequest,
} from "@/types/api-requests";

/**
 * Hook for fetching attendees
 */
export function useAttendees(params?: {
  eventId?: string;
  status?: "registered" | "attended" | "cancelled" | "waitlisted";
  page?: number;
  limit?: number;
}) {
  return useApi<AttendeeListResponse>(
    () => api.attendees.getAll<AttendeeListResponse>(params),
    {
      deps: [params?.eventId, params?.status, params?.page, params?.limit],
    },
  );
}

/**
 * Hook for registering for an event
 */
export function useRegisterForEvent() {
  return useMutation<AttendeeResponse, RegisterForEventRequest>((data) =>
    api.attendees.register<AttendeeResponse>(data),
  );
}

/**
 * Hook for checking in an attendee
 */
export function useCheckInAttendee() {
  return useMutation<AttendeeResponse, CheckInAttendeeRequest>((data) =>
    api.attendees.checkIn<AttendeeResponse>(data.attendeeId),
  );
}

/**
 * Hook for cancelling a registration
 */
export function useCancelRegistration() {
  return useMutation<AttendeeResponse, CancelRegistrationRequest>((data) =>
    api.attendees.cancel<AttendeeResponse>(data.attendeeId),
  );
}

/**
 * Hook for exporting attendees to CSV
 */
export function useExportAttendees() {
  return useMutation<string, { eventId?: string; status?: string }>((params) =>
    api.attendees.exportToCSV<string>(params),
  );
}

/**
 * Hook for managing attendees
 */
export function useAttendeeManager(eventId?: string) {
  const {
    data: attendees,
    isLoading: isLoadingAttendees,
    refetch: refetchAttendees,
    ...attendeesRest
  } = useAttendees({ eventId });

  const registerMutation = useRegisterForEvent();
  const checkInMutation = useCheckInAttendee();
  const cancelMutation = useCancelRegistration();

  const handleRegister = useCallback(
    async (data: RegisterForEventRequest) => {
      const result = await registerMutation.mutate(data);
      await refetchAttendees();
      return result;
    },
    [registerMutation, refetchAttendees],
  );

  const handleCheckIn = useCallback(
    async (attendeeId: string) => {
      const result = await checkInMutation.mutate({ attendeeId });
      await refetchAttendees();
      return result;
    },
    [checkInMutation, refetchAttendees],
  );

  const handleCancel = useCallback(
    async (attendeeId: string, reason?: string) => {
      const result = await cancelMutation.mutate({ attendeeId, reason });
      await refetchAttendees();
      return result;
    },
    [cancelMutation, refetchAttendees],
  );

  return {
    attendees: attendees?.items || [],
    isLoading:
      isLoadingAttendees ||
      registerMutation.isLoading ||
      checkInMutation.isLoading ||
      cancelMutation.isLoading,
    register: handleRegister,
    checkIn: handleCheckIn,
    cancel: handleCancel,
    refetch: refetchAttendees,
    ...attendeesRest,
    registerError: registerMutation.error,
    checkInError: checkInMutation.error,
    cancelError: cancelMutation.error,
  };
}
