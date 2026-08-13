import { redirect } from "next/navigation";

export default function DesignationsRedirectPage() {
  redirect("/dashboard/directory?tab=designations");
}
