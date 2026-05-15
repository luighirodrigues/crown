import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AdminNotificationsForm } from "./admin-notifications-form";

export default async function AdminNotificationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/admin/notifications");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/admin/approvals");
  }

  return <AdminNotificationsForm />;
}
