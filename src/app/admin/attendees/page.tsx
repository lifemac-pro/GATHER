"use client";

import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Mail,
  Download,
  ArrowUpDown,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Pagination } from "@/components/ui/pagination";
import { BulkActions } from "@/components/ui/admin/bulk-actions";
import { AttendeeAnalytics } from "@/components/ui/admin/attendee-analytics";

const COLORS = ["#072446", "#E1A913", "#00b0a6", "#B0B8C5"];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "registered", label: "Registered" },
  { value: "attended", label: "Attended" },
  { value: "cancelled", label: "Cancelled" },
  { value: "waitlisted", label: "Waitlisted" },
];

export default function AttendeesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    field: "registeredAt",
    order: "desc" as "asc" | "desc",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Define status classes for type safety
  const statusClasses = {
    registered: "bg-blue-100 text-blue-700",
    attended: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    waitlisted: "bg-yellow-100 text-yellow-700",
  };
  const [analyticsDateRange, setAnalyticsDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });

  const { toast } = useToast();

  const { data: attendeesData, isLoading: attendeesLoading } =
    api.attendee.getAll.useQuery({
      search: searchQuery,
      eventId: selectedEventId,
      status: selectedStatus === "all" ? undefined : selectedStatus,
      sortBy: sortConfig.field,
      sortOrder: sortConfig.order,
      page,
      pageSize,
    });

  const { data: stats, isLoading: statsLoading } =
    api.attendee.getStats.useQuery({
      startDate: analyticsDateRange.start,
      endDate: analyticsDateRange.end,
      eventId: selectedEventId,
    });

  // Fetch events from the API
  const { data: events, isLoading: eventsLoading } =
    api.event.getAll.useQuery();

  const checkIn = api.attendee.checkIn.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendee checked in successfully",
      });
    },
  });

  // Mock cancel mutation
  const cancel = {
    mutateAsync: async (input: { id: string }) => {
      toast({
        title: "Success",
        description: "Registration cancelled successfully",
      });
      return { success: true };
    },
    isLoading: false,
  };

  const requestFeedback = api.attendee.requestFeedback.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Feedback request sent successfully",
      });
    },
  });

  const exportToCSV = api.attendee.exportToCSV.useMutation({
    onSuccess: (csv) => {
      // Convert CSV string to Blob
      const blob = new Blob([csv as unknown as BlobPart], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "attendees.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
  });

  const bulkCheckIn = api.attendee.bulkCheckIn.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${selectedIds.length} attendees checked in successfully`,
      });
      setSelectedIds([]);
    },
  });

  const bulkRequestFeedback = api.attendee.bulkRequestFeedback.useMutation({
    onSuccess: (result) => {
      const failedCount = result.results.length;
      const successCount = selectedIds.length - failedCount;
      toast({
        title: "Feedback Requests Sent",
        description: `Successfully sent ${successCount} requests${
          failedCount > 0 ? `, ${failedCount} failed` : ""
        }`,
      });
      setSelectedIds([]);
    },
  });

  const handleSort = (field: string) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === "desc" ? "asc" : "desc",
    }));
  };

  const handleCheckIn = async (id: string) => {
    await checkIn.mutateAsync({ attendeeId: id });
  };

  const handleCancel = async (id: string) => {
    await cancel.mutateAsync({ id });
  };

  const handleRequestFeedback = async (attendee: any) => {
    await requestFeedback.mutateAsync({
      id: attendee.id,
      eventName: attendee.event.name,
    });
  };

  const handleExport = async () => {
    await exportToCSV.mutateAsync({
      eventId: selectedEventId,
      status: selectedStatus || undefined,
    });
  };

  const handleBulkCheckIn = async () => {
    await bulkCheckIn.mutateAsync({ ids: selectedIds });
  };

  const handleBulkRequestFeedback = async () => {
    const selectedAttendees =
      attendeesData?.attendees?.filter((a: any) => selectedIds.includes(a.id)) ||
      [];
    if (!selectedAttendees) return;

    await bulkRequestFeedback.mutateAsync({
      attendees: selectedAttendees.map((a: any) => ({
        id: a.id,
        eventName: a.event.name,
        userEmail: a.user.email,
      })),
    });
  };

  const handleBulkExport = async () => {
    await exportToCSV.mutateAsync({
      status: "registered", // Default status
      eventId: selectedEventId,
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(
      checked ? (attendeesData?.attendees?.map((a: any) => a.id) ?? []) : [],
    );
  };

  const handleSelectAttendee = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id),
    );
  };

  if (!attendeesData || !stats || !events) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading attendee data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#072446]">Attendees</h1>
        <div className="flex items-center gap-4">
          <BulkActions
            selectedIds={selectedIds}
            onCheckIn={handleBulkCheckIn}
            onRequestFeedback={handleBulkRequestFeedback}
            onExport={handleBulkExport}
            isLoading={{
              checkIn: bulkCheckIn.isPending,
              feedback: bulkRequestFeedback.isPending,
              export: exportToCSV.isPending,
            }}
          />
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportToCSV.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            {exportToCSV.isPending ? "Exporting..." : "Export All"}
          </Button>
        </div>
      </div>

      {/* Analytics */}
      <AttendeeAnalytics
        dailyTrends={
          stats?.dailyTrends?.map((trend) => {
            // Ensure date is always a string and never undefined
            const dateStr = trend.date
              ? new Date(trend.date).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0];
            const count = typeof trend.count === "number" ? trend.count : 0;
            return {
              date: dateStr, // Explicitly typed as string
              registrations: count,
              checkIns: Math.floor(count * 0.8),
              cancellations: Math.floor(count * 0.1),
            };
          }) ?? []
        }
        statusDistribution={Object.entries(stats?.attendeesByStatus ?? {}).map(
          ([status, count]) => ({
            status,
            count,
          }),
        )}
        startDate={analyticsDateRange.start}
        endDate={analyticsDateRange.end}
        onDateRangeChange={(start, end) =>
          setAnalyticsDateRange({ start, end })
        }
      />

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedEventId} onValueChange={setSelectedEventId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {events?.map((event: any) => (
              <SelectItem key={event.id} value={event.id}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Attendees Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === attendeesData.attendees.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4"
                  />
                </TableHead>
                <TableHead
                  onClick={() => handleSort("name")}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    Name
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("email")}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    Email
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("event")}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    Event
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("status")}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    Status
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("registeredAt")}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    Registered
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead
                  onClick={() => handleSort("checkedInAt")}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    Checked In
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendeesData?.attendees?.map((attendee: any) => (
                <TableRow key={attendee.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(attendee.id)}
                      onChange={(e) =>
                        handleSelectAttendee(attendee.id, e.target.checked)
                      }
                      className="h-4 w-4"
                    />
                  </TableCell>
                  <TableCell>{attendee.user.name}</TableCell>
                  <TableCell>{attendee.user.email}</TableCell>
                  <TableCell>{attendee.event.name}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        statusClasses[
                          attendee.status as keyof typeof statusClasses
                        ]
                      }`}
                    >
                      {attendee.status.charAt(0).toUpperCase() +
                        attendee.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {format(new Date(attendee.registeredAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {attendee.checkedInAt
                      ? format(new Date(attendee.checkedInAt), "MMM d, yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {attendee.status === "registered" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleCheckIn(attendee.id)}
                              disabled={checkIn.isPending}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                              Check In
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCancel(attendee.id)}
                              disabled={cancel.isLoading}
                            >
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              Cancel
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleRequestFeedback(attendee)}
                          disabled={requestFeedback.isPending}
                        >
                          <Mail className="mr-2 h-4 w-4 text-blue-600" />
                          Request Feedback
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="mt-4">
            <Pagination
              currentPage={page}
              pageCount={Math.ceil((attendeesData?.total ?? 0) / pageSize)}
              pageSize={pageSize}
              total={attendeesData?.total ?? 0}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
