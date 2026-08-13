import { redirect } from "next/navigation";

export default function NotificationsRedirectPage() {
  redirect("/dashboard/chat?tab=notifications");
}

