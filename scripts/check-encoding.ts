import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { in: ["cortedarainha.mkt@gmail.com", "hellenisabnun@gmail.com", "flaviadaluzoab@gmail.com", "marianaoalvess@gmail.com"] } },
    include: { profile: true },
  });
  for (const u of users) {
    const b = u.profile?.birthday ? u.profile.birthday.toISOString().slice(0, 10) : null;
    console.log(`${u.name} | city: ${u.profile?.city} | state: ${u.profile?.state} | profession: ${u.profile?.profession} | birthday: ${b} | instagram: ${u.profile?.instagram}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
