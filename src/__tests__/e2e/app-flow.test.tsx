import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { api } from "@/trpc/react";
import HomePage from "@/app/page";
import EventsPage from "@/app/events/page";
import EventDetailsPage from "@/app/events/[id]/page";
import AdminDashboardPage from "@/app/admin/page";
import AdminEventsPage from "@/app/admin/events/page";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock the TRPC API
vi.mock("@/trpc/react", () => ({
  api: {
    event: {
      getAll: {
        useQuery: vi.fn().mockReturnValue({
          data: [
            {
              id: "event-1",
              name: "Tech Conference 2023",
              description: "Annual tech conference",
              location: "Convention Center",
              isVirtual: false,
              startDate: new Date("2023-06-15T09:00:00"),
              endDate: new Date("2023-06-17T18:00:00"),
              category: "tech",
              featured: true,
              price: 99.99,
              image: "/images/tech-conf.jpg",
              status: "published",
              createdById: "user-1",
              isRecurring: false,
            },
            {
              id: "event-2",
              name: "Weekly Team Meeting",
              description: "Regular team sync-up",
              location: "Online",
              isVirtual: true,
              virtualMeetingInfo: {
                provider: "zoom",
                meetingUrl: "https://zoom.us/j/123456789",
                meetingId: "123456789",
                password: "password123",
              },
              startDate: new Date("2023-06-01T10:00:00"),
              endDate: new Date("2023-06-01T11:00:00"),
              category: "business",
              featured: false,
              price: 0,
              image: "/images/meeting.jpg",
              status: "published",
              createdById: "user-1",
              isRecurring: true,
              recurrenceRule: {
                frequency: "weekly",
                interval: 1,
                daysOfWeek: [1], // Monday
              },
            },
          ],
          isLoading: false,
        }),
      },
      getFeatured: {
        useQuery: vi.fn().mockReturnValue({
          data: [
            {
              id: "event-1",
              name: "Tech Conference 2023",
              description: "Annual tech conference",
              location: "Convention Center",
              startDate: new Date("2023-06-15T09:00:00"),
              endDate: new Date("2023-06-17T18:00:00"),
              category: "tech",
              featured: true,
              price: 99.99,
              image: "/images/tech-conf.jpg",
            },
          ],
          isLoading: false,
        }),
      },
      getUpcoming: {
        useQuery: vi.fn().mockReturnValue({
          data: [
            {
              id: "event-1",
              name: "Tech Conference 2023",
              description: "Annual tech conference",
              location: "Convention Center",
              startDate: new Date("2023-06-15T09:00:00"),
              endDate: new Date("2023-06-17T18:00:00"),
              category: "tech",
              featured: true,
              price: 99.99,
              image: "/images/tech-conf.jpg",
            },
            {
              id: "event-2",
              name: "Weekly Team Meeting",
              description: "Regular team sync-up",
              location: "Online",
              isVirtual: true,
              startDate: new Date("2023-06-01T10:00:00"),
              endDate: new Date("2023-06-01T11:00:00"),
              category: "business",
              featured: false,
              price: 0,
              image: "/images/meeting.jpg",
              isRecurring: true,
            },
          ],
          isLoading: false,
        }),
      },
      getById: {
        useQuery: vi.fn().mockReturnValue({
          data: {
            id: "event-1",
            name: "Tech Conference 2023",
            description: "Annual tech conference",
            location: "Convention Center",
            isVirtual: false,
            startDate: new Date("2023-06-15T09:00:00"),
            endDate: new Date("2023-06-17T18:00:00"),
            category: "tech",
            featured: true,
            price: 99.99,
            image: "/images/tech-conf.jpg",
            status: "published",
            createdById: "user-1",
            isRecurring: false,
          },
          isLoading: false,
        }),
      },
      getRecurringInstances: {
        useQuery: vi.fn().mockReturnValue({
          data: [
            {
              id: "event-instance-1",
              name: "Weekly Team Meeting",
              startDate: new Date("2023-06-01T10:00:00"),
              endDate: new Date("2023-06-01T11:00:00"),
            },
            {
              id: "event-instance-2",
              name: "Weekly Team Meeting",
              startDate: new Date("2023-06-08T10:00:00"),
              endDate: new Date("2023-06-08T11:00:00"),
            },
          ],
          isLoading: false,
          refetch: vi.fn(),
        }),
      },
      create: {
        useMutation: vi.fn().mockReturnValue({
          mutateAsync: vi.fn().mockResolvedValue({ id: "new-event-id" }),
          isPending: false,
        }),
      },
      update: {
        useMutation: vi.fn().mockReturnValue({
          mutateAsync: vi.fn().mockResolvedValue({ id: "updated-event-id" }),
          isPending: false,
        }),
      },
      getCategories: {
        useQuery: vi.fn().mockReturnValue({
          data: [
            { name: "general", count: 5 },
            { name: "tech", count: 3 },
            { name: "business", count: 2 },
          ],
        }),
      },
    },
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
            ],
            locations: [
              { location: "New York", count: 30, percentage: 30 },
              { location: "Los Angeles", count: 25, percentage: 25 },
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
              ],
            },
            totalAttendees: 100,
          },
          isLoading: false,
        }),
      },
      getAttendeeStats: {
        useQuery: vi.fn().mockReturnValue({
          data: {
            totalAttendees: 100,
            checkedIn: 75,
            registered: 25,
            cancelled: 0,
            waitlisted: 0,
          },
          isLoading: false,
        }),
      },
    },
    attendee: {
      getByEventId: {
        useQuery: vi.fn().mockReturnValue({
          data: [
            {
              id: "attendee-1",
              name: "John Doe",
              email: "john@example.com",
              status: "checked-in",
              eventId: "event-1",
              registeredAt: new Date("2023-05-01T10:00:00"),
              checkedInAt: new Date("2023-06-15T09:30:00"),
            },
            {
              id: "attendee-2",
              name: "Jane Smith",
              email: "jane@example.com",
              status: "registered",
              eventId: "event-1",
              registeredAt: new Date("2023-05-02T14:00:00"),
            },
          ],
          isLoading: false,
        }),
      },
    },
    useUtils: vi.fn().mockReturnValue({
      event: {
        getAll: {
          invalidate: vi.fn(),
        },
        getFeatured: {
          invalidate: vi.fn(),
        },
        getUpcoming: {
          invalidate: vi.fn(),
        },
      },
    }),
  },
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ href, children }) => {
    return <a href={href}>{children}</a>;
  },
}));

// Mock Clerk
vi.mock("@clerk/nextjs", () => ({
  SignInButton: () => <button>Sign In</button>,
  SignOutButton: () => <button>Sign Out</button>,
  useAuth: () => ({
    isSignedIn: true,
    userId: "user-1",
  }),
  auth: () => ({
    userId: "user-1",
  }),
  currentUser: {
    id: "user-1",
    firstName: "Test",
    lastName: "User",
    emailAddresses: [{ emailAddress: "test@example.com" }],
  },
}));

// Mock Stripe
vi.mock("@/lib/stripe", () => ({
  stripe: {},
  stripePromise: Promise.resolve({}),
}));

// Mock useParams
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: "event-1" }),
}));

describe("End-to-End Application Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip("renders the home page with featured events", async () => {
    render(<HomePage />);

    // Check that the home page renders correctly
    await waitFor(() => {
      expect(screen.getByText("Featured Events")).toBeInTheDocument();
      expect(screen.getByText("Tech Conference 2023")).toBeInTheDocument();
    });
  });

  it.skip("renders the events page with all events", async () => {
    render(<EventsPage />);

    // Check that the events page renders correctly
    await waitFor(() => {
      expect(screen.getByText("All Events")).toBeInTheDocument();
      expect(screen.getByText("Tech Conference 2023")).toBeInTheDocument();
      expect(screen.getByText("Weekly Team Meeting")).toBeInTheDocument();
    });
  });

  it.skip("renders the event details page with event information", async () => {
    // Mock the event details for a non-recurring event
    (api.event.getById.useQuery as vi.Mock).mockReturnValueOnce({
      data: {
        id: "event-1",
        name: "Tech Conference 2023",
        description: "Annual tech conference",
        location: "Convention Center",
        isVirtual: false,
        startDate: new Date("2023-06-15T09:00:00"),
        endDate: new Date("2023-06-17T18:00:00"),
        category: "tech",
        featured: true,
        price: 99.99,
        image: "/images/tech-conf.jpg",
        status: "published",
        createdById: "user-1",
        isRecurring: false,
      },
      isLoading: false,
    });

    render(<EventDetailsPage params={{ id: "event-1" }} />);

    // Check that the event details page renders correctly
    await waitFor(() => {
      expect(screen.getByText("Tech Conference 2023")).toBeInTheDocument();
      expect(screen.getByText("Annual tech conference")).toBeInTheDocument();
      expect(screen.getByText("Convention Center")).toBeInTheDocument();
      expect(screen.getByText("$99.99")).toBeInTheDocument();
    });
  });

  it.skip("renders the event details page for a recurring virtual event", async () => {
    // Mock the event details for a recurring virtual event
    (api.event.getById.useQuery as vi.Mock).mockReturnValueOnce({
      data: {
        id: "event-2",
        name: "Weekly Team Meeting",
        description: "Regular team sync-up",
        location: "Online",
        isVirtual: true,
        virtualMeetingInfo: {
          provider: "zoom",
          meetingUrl: "https://zoom.us/j/123456789",
          meetingId: "123456789",
          password: "password123",
        },
        startDate: new Date("2023-06-01T10:00:00"),
        endDate: new Date("2023-06-01T11:00:00"),
        category: "business",
        featured: false,
        price: 0,
        image: "/images/meeting.jpg",
        status: "published",
        createdById: "user-1",
        isRecurring: true,
        recurrenceRule: {
          frequency: "weekly",
          interval: 1,
          daysOfWeek: [1], // Monday
        },
      },
      isLoading: false,
    });

    render(<EventDetailsPage params={{ id: "event-2" }} />);

    // Check that the event details page renders correctly for a virtual event
    await waitFor(() => {
      expect(screen.getByText("Weekly Team Meeting")).toBeInTheDocument();
      expect(screen.getByText("Virtual Event")).toBeInTheDocument();
      expect(screen.getByText("Join Meeting")).toBeInTheDocument();
      expect(screen.getByText("Meeting ID: 123456789")).toBeInTheDocument();
      expect(screen.getByText("Password: password123")).toBeInTheDocument();
    });

    // Check that recurring event information is displayed
    expect(screen.getByText("Recurring Event")).toBeInTheDocument();
  });

  it.skip("renders the admin dashboard with event statistics", async () => {
    render(<AdminDashboardPage />);

    // Check that the admin dashboard renders correctly
    await waitFor(() => {
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Event Statistics")).toBeInTheDocument();
    });
  });

  it.skip("renders the admin events page with event management options", async () => {
    render(<AdminEventsPage />);

    // Check that the admin events page renders correctly
    await waitFor(() => {
      expect(screen.getByText("Manage Events")).toBeInTheDocument();
      expect(screen.getByText("Tech Conference 2023")).toBeInTheDocument();
      expect(screen.getByText("Weekly Team Meeting")).toBeInTheDocument();
    });
  });
});
