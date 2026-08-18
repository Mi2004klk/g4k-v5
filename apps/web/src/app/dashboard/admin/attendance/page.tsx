import { redirect } from "next/navigation";

export default function AdminAttendanceRedirect() {
  redirect("/dashboard/org/attendance");
}
