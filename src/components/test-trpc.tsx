"use client";

import { api } from "@/trpc/react";
import { useState } from "react";

export function TestTRPC() {
  const [result, setResult] = useState<string>("No result yet");
  
  const handleClick = async () => {
    try {
      // Try a simple TRPC procedure
      const data = await api.post.hello.query({ text: "world" });
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">TRPC Test</h2>
      <button 
        onClick={handleClick}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Test TRPC
      </button>
      <pre className="mt-4 p-2 bg-gray-100 rounded">
        {result}
      </pre>
    </div>
  );
}
