import { userRepository } from "@/repositories/user.repository";
import { requireAuth, handleAuthError } from "@/lib/auth/rbac";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = request.nextUrl;
    const mode = searchParams.get("mode");

    // Paginated mode for /membros page
    if (mode === "paginated") {
      const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
      const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));
      const search = searchParams.get("search") ?? "";
      const sort = searchParams.get("sort") ?? "recent";

      const { members, total } = await userRepository.findMembersPaginated({
        page,
        limit,
        search,
        sort,
      });

      return Response.json({
        members,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    // Default mode for sidebar widgets
    const [recentMembers, allMembers, totalCount] = await Promise.all([
      userRepository.findRecentMembers(30, 5),
      userRepository.findMembersSample(10),
      userRepository.countAll(),
    ]);

    return Response.json({ recentMembers, allMembers, totalCount });
  } catch (error) {
    return handleAuthError(error);
  }
}
