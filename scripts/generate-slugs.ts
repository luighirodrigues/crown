/**
 * One-time script to generate slugs for existing users that don't have one.
 * Run: npx tsx scripts/generate-slugs.ts
 */
import { prisma } from "../src/lib/prisma";
import { generateUniqueSlug } from "../src/lib/slug";

async function main() {
  const usersWithoutSlug = await prisma.user.findMany({
    where: { slug: null },
    select: { id: true, name: true },
  });

  console.log(`Found ${usersWithoutSlug.length} users without slug`);

  for (const user of usersWithoutSlug) {
    const name = user.name || "membro";
    const slug = await generateUniqueSlug(name, user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { slug },
    });
    console.log(`  ${name} → ${slug}`);
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
