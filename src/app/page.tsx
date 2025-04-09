import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to the attendee page
  redirect("/attendee");
}
