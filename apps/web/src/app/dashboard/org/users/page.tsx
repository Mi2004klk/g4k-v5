import { redirect } from "next/navigation";

export default function UsersRedirectPage() {
  redirect("/dashboard/directory?tab=management");
}
