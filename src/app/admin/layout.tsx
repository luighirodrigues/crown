import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/admin/approvals");
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR") {
    redirect("/inicio");
  }

  return <AdminShell>{children}</AdminShell>;
}
