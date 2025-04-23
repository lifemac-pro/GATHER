import { redirect } from "next/navigation";

export default function SignOutPage() {
  // This page is now just a redirect to the success page
  // The actual sign-out process is handled by the SignOutButton component
  redirect("/sign-out/success");
}
