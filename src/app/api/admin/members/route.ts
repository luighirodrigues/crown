import { userRepository } from "@/repositories/user.repository";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";

export async function GET() {
  try {
    await requireRole("ADMIN", "MODERATOR");
    const users = await userRepository.findAllWithCounts();
    return Response.json(users);
  } catch (error) {
    return handleAuthError(error);
  }
}
