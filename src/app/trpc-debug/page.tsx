import { api } from "@/trpc/server";

export default async function TRPCDebugPage() {
  let postResult = "Not executed";
  let eventResult = "Not executed";
  let postError = null;
  let eventError = null;

  // Test post.hello procedure
  try {
    // In TRPC v11, we call the procedure directly without .query()
    const data = await api.post.hello({ text: "world" });
    postResult = JSON.stringify(data, null, 2);
  } catch (err) {
    postError = err instanceof Error ? err.message : String(err);
  }

  // Test event.getFeatured procedure
  try {
    const events = await api.event.getFeatured();
    eventResult = JSON.stringify(events, null, 2);
  } catch (err) {
    eventError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">TRPC Debug Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border rounded-lg p-6 bg-white shadow">
          <h2 className="text-xl font-bold mb-4">post.hello Procedure</h2>

          {postError ? (
            <div className="p-4 bg-red-100 border border-red-400 rounded mb-4">
              <h3 className="font-bold text-red-800">Error:</h3>
              <pre className="mt-2 text-red-700 whitespace-pre-wrap">{postError}</pre>
            </div>
          ) : (
            <div className="p-4 bg-green-100 border border-green-400 rounded mb-4">
              <h3 className="font-bold text-green-800">Success:</h3>
              <pre className="mt-2 whitespace-pre-wrap">{postResult}</pre>
            </div>
          )}
        </div>

        <div className="border rounded-lg p-6 bg-white shadow">
          <h2 className="text-xl font-bold mb-4">event.getFeatured Procedure</h2>

          {eventError ? (
            <div className="p-4 bg-red-100 border border-red-400 rounded mb-4">
              <h3 className="font-bold text-red-800">Error:</h3>
              <pre className="mt-2 text-red-700 whitespace-pre-wrap">{eventError}</pre>
            </div>
          ) : (
            <div className="p-4 bg-green-100 border border-green-400 rounded mb-4">
              <h3 className="font-bold text-green-800">Success:</h3>
              <pre className="mt-2 whitespace-pre-wrap">{eventResult}</pre>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 p-6 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-bold mb-4">Debugging Tips</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Check if MongoDB is properly connected</li>
          <li>Verify that the Event model is correctly defined</li>
          <li>Ensure TRPC routers are properly registered in the root router</li>
          <li>Check for authentication issues with Clerk</li>
        </ul>
      </div>
    </div>
  );
}
