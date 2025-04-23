"use client";

import { api } from "@/trpc/react";
import { useState } from "react";

export function TestTRPC() {
  const [result, setResult] = useState<string>("No result yet");

  const handleClick = async () => {
    try {
      // Try a simple TRPC procedure
      // Mock mutation for testing
      const mutateAsync = async (input: { text: string }) => {
        return { greeting: `Hello ${input.text}` };
      };
      const data = await mutateAsync({ text: "world" });
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  return (
    <div className="rounded border p-4">
      <h2 className="mb-4 text-xl font-bold">TRPC Test</h2>
      <button
        onClick={handleClick}
        className="rounded bg-blue-500 px-4 py-2 text-white"
      >
        Test TRPC
      </button>
      <pre className="mt-4 rounded bg-gray-100 p-2">{result}</pre>
    </div>
  );
}
