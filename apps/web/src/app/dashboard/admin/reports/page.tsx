import { redirect } from "next/navigation";

export default function AdminReportsRedirect() {
  redirect("/dashboard/reports");
}
