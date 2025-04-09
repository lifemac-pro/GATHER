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
        success: {
          style: {
            background: "#ecfdf5",
            border: "1px solid #d1fae5",
            color: "#065f46",
          },
        },
        error: {
          style: {
            background: "#fef2f2",
            border: "1px solid #fee2e2",
            color: "#b91c1c",
          },
        },
      }}
    />
  );
}
