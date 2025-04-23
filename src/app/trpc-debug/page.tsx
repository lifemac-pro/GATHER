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
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">TRPC Debug Page</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">post.hello Procedure</h2>

          {postError ? (
            <div className="mb-4 rounded border border-red-400 bg-red-100 p-4">
              <h3 className="font-bold text-red-800">Error:</h3>
              <pre className="mt-2 whitespace-pre-wrap text-red-700">
                {postError}
              </pre>
            </div>
          ) : (
            <div className="mb-4 rounded border border-green-400 bg-green-100 p-4">
              <h3 className="font-bold text-green-800">Success:</h3>
              <pre className="mt-2 whitespace-pre-wrap">{postResult}</pre>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-bold">
            event.getFeatured Procedure
          </h2>

          {eventError ? (
            <div className="mb-4 rounded border border-red-400 bg-red-100 p-4">
              <h3 className="font-bold text-red-800">Error:</h3>
              <pre className="mt-2 whitespace-pre-wrap text-red-700">
                {eventError}
              </pre>
            </div>
          ) : (
            <div className="mb-4 rounded border border-green-400 bg-green-100 p-4">
              <h3 className="font-bold text-green-800">Success:</h3>
              <pre className="mt-2 whitespace-pre-wrap">{eventResult}</pre>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-lg border bg-gray-50 p-6">
        <h2 className="mb-4 text-xl font-bold">Debugging Tips</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Check if MongoDB is properly connected</li>
          <li>Verify that the Event model is correctly defined</li>
          <li>
            Ensure TRPC routers are properly registered in the root router
          </li>
          <li>Check for authentication issues with Clerk</li>
        </ul>
      </div>
    </div>
  );
}
