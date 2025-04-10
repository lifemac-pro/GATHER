import { api } from "@/trpc/server";

export default async function TestPage() {
  let result = "No result";
  let error = null;
  
  try {
    // Try a simple procedure from the post router
    const data = await api.post.hello.query({ text: "world" });
    result = JSON.stringify(data, null, 2);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">TRPC Test Page</h1>
      
      {error ? (
        <div className="p-4 bg-red-100 border border-red-400 rounded mb-4">
          <h2 className="font-bold text-red-800">Error:</h2>
          <pre className="mt-2 text-red-700">{error}</pre>
        </div>
      ) : (
        <div className="p-4 bg-green-100 border border-green-400 rounded mb-4">
          <h2 className="font-bold text-green-800">Success:</h2>
          <pre className="mt-2">{result}</pre>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Debugging Information</h2>
        <ul className="list-disc pl-5">
          <li>Using server-side TRPC client</li>
          <li>Testing the post.hello procedure</li>
        </ul>
      </div>
    </div>
  );
}
