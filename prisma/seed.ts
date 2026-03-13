import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function nameToSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function main() {
  console.log("🌱 Seeding database...");

  const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@crown.dev";

  // ─── Admin User ──────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      name: "Admin Crown",
      slug: nameToSlug("Admin Crown"),
      role: "ADMIN",
      emailVerified: new Date(),
      image: "https://api.dicebear.com/9.x/notionists/svg?seed=admin",
      profile: {
        create: {
          bio: "Administradora da plataforma CROWN.",
          interests: ["Empreendedorismo", "Liderança", "Comunidade"],
          skills: ["Gestão", "Estratégia", "Marketing"],
        },
      },
    },
  });
  console.log(`  ✅ Admin: ${admin.email} (${admin.id})`);

  // ─── Sample Members ──────────────────────────────────
  const memberEmails = [
    { email: "maria@crown.dev", name: "Maria Silva" },
    { email: "ana@crown.dev", name: "Ana Oliveira" },
    { email: "juliana@crown.dev", name: "Juliana Costa" },
  ];

  const members = [];
  for (const m of memberEmails) {
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: {
        email: m.email,
        name: m.name,
        slug: nameToSlug(m.name),
        role: "MEMBER",
        emailVerified: new Date(),
        image: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(m.name)}`,
        profile: {
          create: {
            bio: `Membro da comunidade CROWN.`,
            interests: ["Empreendedorismo"],
            skills: ["Planejamento"],
          },
        },
      },
    });
    members.push(user);
    console.log(`  ✅ Member: ${user.email} (${user.id})`);
  }

  // ─── Channels ────────────────────────────────────────
  const channelsData = [
    { name: "Planejamento", slug: "planejamento", icon: "Target" },
    { name: "Revisão", slug: "revisao", icon: "ClipboardCheck" },
    { name: "Conteúdo Estratégico", slug: "conteudo-estrategico", icon: "Lightbulb" },
  ];

  const channels = [];
  for (const ch of channelsData) {
    const channel = await prisma.channel.upsert({
      where: { slug: ch.slug },
      update: {},
      create: ch,
    });
    channels.push(channel);
    console.log(`  ✅ Channel: ${channel.name} (${channel.id})`);
  }

  // ─── Rituals ─────────────────────────────────────────
  // March 2026 rituals - active for the current period
  const ritualsData = [
    {
      name: "Ritual da Consistência",
      description:
        "Compartilhe diariamente uma ação que você tomou para avançar no seu negócio. Pode ser algo simples ou grandioso — o importante é a constância.",
      pointsValue: 10,
      startAt: new Date("2026-03-01T03:00:00.000Z"), // March 1 BRT
      endAt: new Date("2026-03-31T02:59:59.000Z"), // March 31 BRT
      autoApprove: true,
      imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=300&fit=crop",
    },
    {
      name: "Ritual de Gratidão",
      description:
        "Registre 3 coisas pelas quais você é grata hoje. A gratidão transforma a perspectiva e fortalece a mentalidade empreendedora.",
      pointsValue: 5,
      startAt: new Date("2026-03-01T03:00:00.000Z"),
      endAt: new Date("2026-03-31T02:59:59.000Z"),
      autoApprove: true,
      imageUrl: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&h=300&fit=crop",
    },
  ];

  for (const r of ritualsData) {
    const existing = await prisma.ritual.findFirst({ where: { name: r.name } });
    if (!existing) {
      const ritual = await prisma.ritual.create({ data: r });
      console.log(`  ✅ Ritual: ${ritual.name} (${ritual.id})`);
    } else {
      console.log(`  ⏭️  Ritual already exists: ${r.name}`);
    }
  }

  // ─── Events ──────────────────────────────────────────
  const eventsData = [
    {
      title: "Masterclass: Estratégias de Vendas",
      description: "Aprenda técnicas avançadas de vendas para escalar seu negócio com a mentora convidada.",
      datetime: new Date("2026-03-10T18:00:00.000Z"),
      link: "https://meet.google.com/crown-masterclass",
      location: "Online (Google Meet)",
    },
    {
      title: "Círculo das Rainhas — Networking",
      description: "Encontro mensal para compartilhar conquistas, desafios e oportunidades de parceria.",
      datetime: new Date("2026-03-15T20:00:00.000Z"),
      location: "Online (Zoom)",
    },
    {
      title: "Workshop: Planejamento Q2 2026",
      description: "Sessão prática para planejar o segundo trimestre do ano com metas claras e ações definidas.",
      datetime: new Date("2026-03-22T17:00:00.000Z"),
      link: "https://meet.google.com/crown-workshop",
      location: "Online (Google Meet)",
    },
  ];

  for (const e of eventsData) {
    const existing = await prisma.event.findFirst({ where: { title: e.title } });
    if (!existing) {
      const event = await prisma.event.create({ data: e });
      console.log(`  ✅ Event: ${event.title} (${event.id})`);
    } else {
      console.log(`  ⏭️  Event already exists: ${e.title}`);
    }
  }

  // ─── Course + Lessons ────────────────────────────────
  const existingCourse = await prisma.course.findFirst({
    where: { name: "Fundamentos do Empreendedorismo Feminino" },
  });

  if (!existingCourse) {
    const course = await prisma.course.create({
      data: {
        name: "Fundamentos do Empreendedorismo Feminino",
        description:
          "Curso completo sobre os pilares do empreendedorismo feminino, da mentalidade à execução.",
        imageUrl: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=300&fit=crop",
        lessons: {
          create: [
            {
              title: "Aula 1: Mentalidade Empreendedora",
              link: "https://www.youtube.com/watch?v=example1",
              order: 1,
            },
            {
              title: "Aula 2: Planejamento e Metas",
              link: "https://www.youtube.com/watch?v=example2",
              order: 2,
            },
          ],
        },
      },
    });
    console.log(`  ✅ Course: ${course.name} (${course.id}) + 2 lessons`);
  } else {
    console.log(`  ⏭️  Course already exists: Fundamentos do Empreendedorismo Feminino`);
  }

  // ─── Points Rules (scaffold) ─────────────────────────
  const rulesData = [
    { key: "CREATE_POST", label: "Criar post", points: 5 },
    { key: "COMMENT", label: "Comentar", points: 3 },
    { key: "RITUAL_CHECKIN", label: "Check-in em ritual", points: 10 },
    { key: "MISSION_COMPLETE", label: "Completar missão", points: 20 },
    { key: "LESSON_COMPLETE", label: "Completar aula", points: 5 },
  ];

  for (const rule of rulesData) {
    await prisma.pointsRule.upsert({
      where: { key: rule.key },
      update: { points: rule.points },
      create: rule,
    });
  }
  console.log(`  ✅ PointsRules: ${rulesData.length} rules seeded`);

  // ─── Missions (samples) ──────────────────────────────
  const missionsData = [
    {
      name: "Planejar Março",
      description: "Crie seu planejamento completo para o mês de março com metas e ações definidas.",
      type: "MANUAL" as const,
      autoApprove: false,
      tributos: 20,
      startAt: new Date("2026-03-01T03:00:00.000Z"),
      endAt: new Date("2026-03-31T02:59:59.000Z"),
    },
    {
      name: "Revisar Fevereiro",
      description: "Faça uma revisão completa do mês de fevereiro: o que funcionou, o que pode melhorar.",
      type: "MANUAL" as const,
      autoApprove: true,
      tributos: 15,
      startAt: new Date("2026-03-01T03:00:00.000Z"),
      endAt: new Date("2026-03-15T02:59:59.000Z"),
    },
  ];

  for (const m of missionsData) {
    const existing = await prisma.mission.findFirst({ where: { name: m.name } });
    if (!existing) {
      const mission = await prisma.mission.create({ data: m });
      console.log(`  ✅ Mission: ${mission.name} (${mission.id})`);
    } else {
      console.log(`  ⏭️  Mission already exists: ${m.name}`);
    }
  }

  console.log("\n🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
