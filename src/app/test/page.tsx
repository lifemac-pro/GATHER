import { TestTRPC } from "@/components/test-trpc";

export default function TestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-2xl font-bold">TRPC Test Page</h1>
      <TestTRPC />
    </div>
  );
}
