import { redirect } from "next/navigation";

export default function AuditRedirectPage() {
  redirect("/dashboard/settings?tab=audit");
}
