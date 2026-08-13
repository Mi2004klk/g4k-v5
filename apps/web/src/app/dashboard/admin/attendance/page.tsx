import { redirect } from "next/navigation";

export default function AdminAttendanceRedirectPage() {
  redirect("/dashboard/org/attendance");
}
