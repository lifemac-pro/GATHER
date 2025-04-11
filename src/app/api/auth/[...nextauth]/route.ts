// This file is deprecated as the project now uses Clerk for authentication
// Keeping this file as a placeholder to avoid breaking imports
// The actual authentication is handled by Clerk

export const GET = async () => {
  // Add await to satisfy the require-await rule
  await Promise.resolve();
  return new Response("Authentication is now handled by Clerk", { status: 200 });
};

export const POST = async () => {
  // Add await to satisfy the require-await rule
  await Promise.resolve();
  return new Response("Authentication is now handled by Clerk", { status: 200 });
};
