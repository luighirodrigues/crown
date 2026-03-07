import { approvalService } from "@/services/approval.service";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";

export async function GET() {
  try {
    await requireRole("ADMIN", "MODERATOR");

    const [pendingCheckIns, pendingMissions] = await Promise.all([
      approvalService.listPendingCheckIns(),
      approvalService.listPendingMissions(),
    ]);

    return Response.json({
      checkIns: pendingCheckIns,
      missions: pendingMissions,
      totalPending: pendingCheckIns.length + pendingMissions.length,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
