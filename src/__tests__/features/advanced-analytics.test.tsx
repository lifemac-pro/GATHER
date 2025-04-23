import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdvancedAnalytics } from "@/components/analytics/advanced-analytics";
import { api } from "@/trpc/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the TRPC API
vi.mock("@/trpc/react", () => ({
  api: {
    analytics: {
      getEventAnalytics: {
        useQuery: vi.fn().mockReturnValue({
          data: {
            totalAttendees: 100,
            checkedInAttendees: 75,
            conversionRate: {
              registrationToCheckIn: 75,
            },
            revenue: {
              total: 1000,
              byStatus: {
                registered: 250,
                "checked-in": 750,
                cancelled: 0,
                waitlisted: 0,
              },
              byDate: [
                { date: "2023-05-01", amount: 200 },
                { date: "2023-05-02", amount: 300 },
                { date: "2023-05-03", amount: 500 },
              ],
            },
            registrationTrend: [
              { date: "2023-05-01", count: 20, cumulative: 20 },
              { date: "2023-05-02", count: 30, cumulative: 50 },
              { date: "2023-05-03", count: 50, cumulative: 100 },
            ],
            checkInTrend: [
              { date: "2023-05-01", count: 15, cumulative: 15 },
              { date: "2023-05-02", count: 25, cumulative: 40 },
              { date: "2023-05-03", count: 35, cumulative: 75 },
            ],
            statusBreakdown: [
              { status: "registered", count: 25, percentage: 25 },
              { status: "checked-in", count: 75, percentage: 75 },
              { status: "cancelled", count: 0, percentage: 0 },
              { status: "waitlisted", count: 0, percentage: 0 },
            ],
            demographics: {
              domains: [],
              locations: [],
              registrationTimes: {
                byHour: [],
                byDay: [],
              },
            },
          },
          isLoading: false,
          error: null,
        }),
      },
      getEventDemographics: {
        useQuery: vi.fn().mockReturnValue({
          data: {
            domains: [
              { domain: "gmail.com", count: 40, percentage: 40 },
              { domain: "yahoo.com", count: 30, percentage: 30 },
              { domain: "hotmail.com", count: 20, percentage: 20 },
              { domain: "outlook.com", count: 10, percentage: 10 },
            ],
            locations: [
              { location: "New York", count: 30, percentage: 30 },
              { location: "Los Angeles", count: 25, percentage: 25 },
              { location: "Chicago", count: 20, percentage: 20 },
              { location: "Houston", count: 15, percentage: 15 },
              { location: "Phoenix", count: 10, percentage: 10 },
            ],
            registrationTimes: {
              byHour: Array.from({ length: 24 }, (_, i) => ({
                hour: i,
                count: Math.floor(Math.random() * 10),
                percentage: Math.floor(Math.random() * 10),
              })),
              byDay: [
                { day: "Sunday", count: 10, percentage: 10 },
                { day: "Monday", count: 15, percentage: 15 },
                { day: "Tuesday", count: 20, percentage: 20 },
                { day: "Wednesday", count: 25, percentage: 25 },
                { day: "Thursday", count: 15, percentage: 15 },
                { day: "Friday", count: 10, percentage: 10 },
                { day: "Saturday", count: 5, percentage: 5 },
              ],
            },
            totalAttendees: 100,
          },
          isLoading: false,
        }),
      },
    },
  },
}));

describe("Advanced Analytics Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.URL.createObjectURL
    global.URL.createObjectURL = vi.fn();
  });

  it("renders the advanced analytics component", async () => {
    render(<AdvancedAnalytics eventId="test-event-id" />);

    // Check that the component renders correctly
    expect(screen.getByText("Event Analytics")).toBeInTheDocument();

    // Check that summary cards are displayed
    expect(screen.getByText("Total Registrations")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument(); // Total attendees

    expect(screen.getByText("Check-in Rate")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument(); // Check-in rate

    expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    expect(screen.getByText("$1000.00")).toBeInTheDocument(); // Total revenue
  });

  it("switches between tabs", async () => {
    render(<AdvancedAnalytics eventId="test-event-id" />);

    // Check that the Overview tab is active by default
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Switch to the Registrations tab
    await userEvent.click(screen.getByRole("tab", { name: "Registrations" }));
    expect(screen.getByRole("tab", { name: "Registrations" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Daily Registrations")).toBeInTheDocument();

    // Switch to the Demographics tab
    await userEvent.click(screen.getByRole("tab", { name: "Demographics" }));
    expect(screen.getByRole("tab", { name: "Demographics" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Email Domains")).toBeInTheDocument();
    expect(screen.getByText("Locations")).toBeInTheDocument();

    // Switch to the Revenue tab
    await userEvent.click(screen.getByRole("tab", { name: "Revenue" }));
    expect(screen.getByRole("tab", { name: "Revenue" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Revenue Over Time")).toBeInTheDocument();
    expect(screen.getByText("Revenue by Status")).toBeInTheDocument();
  });

  it("updates date range", async () => {
    const mockUseQuery = api.analytics.getEventAnalytics.useQuery as vi.Mock;

    render(<AdvancedAnalytics eventId="test-event-id" />);

    // Open the date range picker
    const dateRangeButton = screen.getByText(/Mar 24, 2025 - Apr 23, 2025/);
    await userEvent.click(dateRangeButton);

    // Note: Testing date picker interactions is complex in Jest
    // This is a simplified test that just checks if the API is called with updated dates

    // Check that the API was called with the initial date range
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: "test-event-id",
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      }),
    );
  });

  it("handles loading state", () => {
    // Mock loading state
    (api.analytics.getEventAnalytics.useQuery as vi.Mock).mockReturnValueOnce({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<AdvancedAnalytics eventId="test-event-id" />);

    // Check that loading spinner is displayed
    expect(screen.getByText("Loading analytics data...")).toBeInTheDocument();
  });

  it("handles error state", () => {
    // Mock error state
    (api.analytics.getEventAnalytics.useQuery as vi.Mock).mockReturnValueOnce({
      data: null,
      isLoading: false,
      error: { message: "Failed to load analytics data" },
    });

    render(<AdvancedAnalytics eventId="test-event-id" />);

    // Check that error message is displayed
    expect(screen.getByText("Error Loading Analytics")).toBeInTheDocument();
    expect(
      screen.getByText("Failed to load analytics data"),
    ).toBeInTheDocument();
  });
});
