import { prisma } from "@/lib/prisma";

/**
 * Generate a URL-safe slug from a name, LinkedIn-style.
 * Example: "Maria Silva" → "maria-silva", "maria-silva-1", "maria-silva-2", etc.
 */
export function nameToBaseSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // remove special chars
    .trim()
    .replace(/\s+/g, "-") // spaces to hyphens
    .replace(/-+/g, "-"); // collapse multiple hyphens
}

/**
 * Generate a unique slug for a user. If the base slug is taken,
 * appends an incrementing number suffix.
 */
export async function generateUniqueSlug(name: string, excludeUserId?: string): Promise<string> {
  const base = nameToBaseSlug(name) || "membro";

  // Check if base slug is available
  const existing = await prisma.user.findUnique({ where: { slug: base } });
  if (!existing || (excludeUserId && existing.id === excludeUserId)) {
    return base;
  }

  // Find next available number
  let counter = 1;
  while (counter < 1000) {
    const candidate = `${base}-${counter}`;
    const taken = await prisma.user.findUnique({ where: { slug: candidate } });
    if (!taken || (excludeUserId && taken.id === excludeUserId)) {
      return candidate;
    }
    counter++;
  }

  // Fallback: append random suffix
  const random = Math.random().toString(36).slice(2, 6);
  return `${base}-${random}`;
}
