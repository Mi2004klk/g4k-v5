import { redirect } from "next/navigation";

export default function DepartmentsRedirectPage() {
  redirect("/dashboard/directory?tab=departments");
}
