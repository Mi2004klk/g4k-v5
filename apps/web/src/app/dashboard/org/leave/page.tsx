import { redirect } from "next/navigation";

export default function OrgLeaveRedirectPage() {
  redirect("/dashboard/attendance?tab=approvals");
}
