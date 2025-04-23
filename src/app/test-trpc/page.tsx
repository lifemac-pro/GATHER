import { api } from "@/trpc/server";

export default async function TestPage() {
  let result = "No result";
  let error = null;

  try {
    // Try a simple procedure from the post router
    const data = await api.post.hello({ text: "world" });
    result = JSON.stringify(data, null, 2);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-2xl font-bold">TRPC Test Page</h1>

      {error ? (
        <div className="mb-4 rounded border border-red-400 bg-red-100 p-4">
          <h2 className="font-bold text-red-800">Error:</h2>
          <pre className="mt-2 text-red-700">{error}</pre>
        </div>
      ) : (
        <div className="mb-4 rounded border border-green-400 bg-green-100 p-4">
          <h2 className="font-bold text-green-800">Success:</h2>
          <pre className="mt-2">{result}</pre>
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-bold">Debugging Information</h2>
        <ul className="list-disc pl-5">
          <li>Using server-side TRPC client</li>
          <li>Testing the post.hello procedure</li>
        </ul>
      </div>
    </div>
  );
}
