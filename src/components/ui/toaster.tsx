"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#fff",
          color: "#072446",
          border: "1px solid #e2e8f0",
        },
        classNames: {
          success: "bg-green-50 border-green-200 text-green-800",
          error: "bg-red-50 border-red-200 text-red-800",
        },
      }}
    />
  );
}
