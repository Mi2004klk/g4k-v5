import { redirect } from "next/navigation";

export default function OrgLeaveRedirectPage() {
  redirect("/dashboard/org/attendance?tab=leave&sub=approvals");
}
