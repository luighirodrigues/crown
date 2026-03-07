import { NextRequest } from "next/server";
import { pointsRuleRepository } from "@/repositories/points-rule.repository";
import { requireRole, handleAuthError } from "@/lib/auth/rbac";
import { z } from "zod/v4";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const rules = await pointsRuleRepository.findAll();
    return Response.json(rules);
  } catch (error) {
    return handleAuthError(error);
  }
}

const updateRuleSchema = z.object({
  key: z.string(),
  label: z.string().optional(),
  points: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await request.json();
    const parsed = updateRuleSchema.parse(body);

    const { key, ...data } = parsed;
    const rule = await pointsRuleRepository.update(key, data);
    return Response.json(rule);
  } catch (error) {
    return handleAuthError(error);
  }
}
