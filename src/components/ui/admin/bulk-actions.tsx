"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, CheckCircle2, Mail, Download } from "lucide-react";

interface BulkActionsProps {
  selectedIds: string[];
  onCheckIn: () => void;
  onRequestFeedback: () => void;
  onExport: () => void;
  isLoading: {
    checkIn: boolean;
    feedback: boolean;
    export: boolean;
  };
}

export function BulkActions({
  selectedIds,
  onCheckIn,
  onRequestFeedback,
  onExport,
  isLoading,
}: BulkActionsProps) {
  const hasSelection = selectedIds.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-[180px]"
          disabled={!hasSelection}
        >
          Bulk Actions
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuItem
          onClick={onCheckIn}
          disabled={isLoading.checkIn || !hasSelection}
        >
          <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
          {isLoading.checkIn ? "Checking in..." : "Check In"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onRequestFeedback}
          disabled={isLoading.feedback || !hasSelection}
        >
          <Mail className="mr-2 h-4 w-4 text-blue-600" />
          {isLoading.feedback ? "Sending..." : "Request Feedback"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onExport}
          disabled={isLoading.export || !hasSelection}
        >
          <Download className="mr-2 h-4 w-4 text-gray-600" />
          {isLoading.export ? "Exporting..." : "Export Selected"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
