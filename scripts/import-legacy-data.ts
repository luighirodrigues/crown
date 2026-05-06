import { PrismaClient, Role } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import { nameToBaseSlug } from "../src/lib/slug";

const prisma = new PrismaClient();

// ─── Email merge mapping ────────────────────────────────────
const EMAIL_ALIASES: Record<string, string> = {
  "ale.munhozfer@hotmail.com": "ale.munhozfer@gmail.com",
  "folettocaroline@gmail.com": "folettocarolinecontato@gmail.com",
  "suelencontadorars@gmail.com": "suelencorrea527@gmail.com",
};

function canonicalEmail(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  return EMAIL_ALIASES[trimmed] || trimmed;
}

// ─── CSV Parser (semicolon-delimited, quoted, multi-line) ──
function parseCsv(filePath: string): string[][] {
  const raw = readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let inQuotes = false;
  let row: string[] = [];
  let field = "";

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (inQuotes) {
      if (ch === '"') {
        if (raw[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ";") {
        row.push(field);
        field = "";
      } else if (ch === "\r" && raw[i + 1] === "\n") {
        row.push(field);
        field = "";
        if (row.length > 1 || row.some((c) => c.trim() !== "")) {
          rows.push(row);
        }
        row = [];
        i++;
      } else if (ch === "\n") {
        row.push(field);
        field = "";
        if (row.length > 1 || row.some((c) => c.trim() !== "")) {
          rows.push(row);
        }
        row = [];
      } else {
        field += ch;
      }
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

// ─── Date parsing ────────────────────────────────────────────
function parseBirthday(raw: string): Date | null {
  const s = raw?.trim();
  if (!s) return null;

  // ISO format: 2026-01-21T03:00:00.000Z
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoMatch) {
    return new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T12:00:00.000Z`);
  }

  // YYYY-MM-DD
  const ymdMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) {
    return new Date(`${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}T12:00:00.000Z`);
  }

  // DD/MM/YYYY
  const dmyMatch = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmyMatch) {
    return new Date(`${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}T12:00:00.000Z`);
  }

  return null;
}

function parseCheckinDate(raw: string): string | null {
  const s = raw?.trim();
  if (!s) return null;

  // Format: "DD/MM/YYYY; HH:MM:SS" or "DD/MM/YYYY"
  const match = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }

  return null;
}

// ─── Interests parsing ───────────────────────────────────────
function parseInterests(raw: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ─── Membra type ─────────────────────────────────────────────
interface MembraRow {
  fullName: string;
  displayName: string;
  email: string;
  nivel: string;
  profissao: string;
  cidade: string;
  estado: string;
  instagram: string;
  biografia: string;
  interesses: string[];
  dataAniversario: Date | null;
  pontuacao: number;
  pontuacaoMensal: number;
  emojiTitulo: string;
}

interface CheckinRow {
  userName: string;
  userEmail: string;
  desafio: string;
  horario: string;
  observacao: string;
  diaEspecifico: string;
  dataCheckin: string | null;
}

// ─── Count non-empty fields for dedup ────────────────────────
function dataScore(m: MembraRow): number {
  let score = 0;
  if (m.fullName) score++;
  if (m.displayName) score++;
  if (m.profissao) score++;
  if (m.cidade) score++;
  if (m.estado) score++;
  if (m.instagram) score++;
  if (m.biografia) score++;
  if (m.interesses.length > 0) score++;
  if (m.dataAniversario) score++;
  return score;
}

// ─── Read & parse membras CSV ────────────────────────────────
function readMembas(filePath: string): MembraRow[] {
  const rows = parseCsv(filePath);
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = {
    full_name: header.indexOf("full_name"),
    nome_display: header.indexOf("nome_display"),
    user_email: header.indexOf("user_email"),
    nivel: header.indexOf("nivel"),
    profissao: header.indexOf("profissao"),
    cidade: header.indexOf("cidade"),
    estado: header.indexOf("estado"),
    instagram: header.indexOf("instagram"),
    biografia: header.indexOf("biografia"),
    interesses: header.indexOf("interesses"),
    data_aniversario: header.indexOf("data_aniversario"),
    pontuacao: header.indexOf("pontuacao"),
    pontuacao_mensal: header.indexOf("pontuacao_mensal"),
    emoji_titulo: header.indexOf("emoji_titulo"),
  };

  const membras: MembraRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const get = (col: number) => (col >= 0 && col < r.length ? r[col].trim() : "");

    const email = canonicalEmail(get(idx.user_email));
    if (!email) continue;

    const pontuacaoStr = get(idx.pontuacao);
    const pontMensalStr = get(idx.pontuacao_mensal);

    membras.push({
      fullName: get(idx.full_name),
      displayName: get(idx.nome_display),
      email,
      nivel: get(idx.nivel),
      profissao: get(idx.profissao),
      cidade: get(idx.cidade),
      estado: get(idx.estado),
      instagram: get(idx.instagram),
      biografia: get(idx.biografia),
      interesses: parseInterests(get(idx.interesses)),
      dataAniversario: parseBirthday(get(idx.data_aniversario)),
      pontuacao: pontuacaoStr ? parseInt(pontuacaoStr, 10) || 0 : 0,
      pontuacaoMensal: pontMensalStr ? parseInt(pontMensalStr, 10) || 0 : 0,
      emojiTitulo: get(idx.emoji_titulo),
    });
  }

  return membras;
}

// ─── Read & parse checkins CSV ───────────────────────────────
function readCheckins(filePath: string): CheckinRow[] {
  const rows = parseCsv(filePath);
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/\uFEFF/g, ""));
  const idx = {
    user_name: header.indexOf("user_name"),
    user_email: header.indexOf("user_email"),
    desafio: header.indexOf("desafio"),
    horario: header.indexOf("horario"),
    observacao: header.indexOf("observacao"),
    dia_especifico: header.indexOf("dia_especifico"),
    data_checkin: header.indexOf("data_checkin"),
  };

  const checkins: CheckinRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const get = (col: number) => (col >= 0 && col < r.length ? r[col].trim() : "");

    const email = canonicalEmail(get(idx.user_email));
    if (!email) continue;

    checkins.push({
      userName: get(idx.user_name),
      userEmail: email,
      desafio: get(idx.desafio),
      horario: get(idx.horario),
      observacao: get(idx.observacao),
      diaEspecifico: get(idx.dia_especifico),
      dataCheckin: parseCheckinDate(get(idx.data_checkin)),
    });
  }

  return checkins;
}

// ─── Deduplicate membras ─────────────────────────────────────
function deduplicateMembas(membras: MembraRow[]): MembraRow[] {
  const byEmail = new Map<string, MembraRow>();

  for (const m of membras) {
    const existing = byEmail.get(m.email);
    if (!existing) {
      byEmail.set(m.email, m);
    } else {
      const existingScore = dataScore(existing);
      const currentScore = dataScore(m);
      if (currentScore > existingScore) {
        byEmail.set(m.email, m);
      } else if (currentScore === existingScore && m.pontuacao > existing.pontuacao) {
        byEmail.set(m.email, m);
      }
    }
  }

  return Array.from(byEmail.values());
}

function normalizeRitualName(name: string): string {
  return name
    .replace(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Ritual definitions ──────────────────────────────────────
const RITUAL_DEFINITIONS = [
  {
    name: "Leitura Diária - 10 Páginas",
    description: "Desafio diário de leitura de pelo menos 10 páginas. Importado da plataforma antiga.",
    pointsValue: 10,
    startAt: new Date("2025-12-01T03:00:00.000Z"),
    endAt: new Date("2026-04-30T02:59:59.000Z"),
    autoApprove: true,
  },
  {
    name: "Atividade Física Diária",
    description: "Registro diário de atividade física. Importado da plataforma antiga.",
    pointsValue: 10,
    startAt: new Date("2025-12-01T03:00:00.000Z"),
    endAt: new Date("2026-04-30T02:59:59.000Z"),
    autoApprove: true,
  },
  {
    name: "Gratidão & Conquista do Dia",
    description: "Registro diário de gratidão e conquistas. Importado da plataforma antiga.",
    pointsValue: 10,
    startAt: new Date("2025-12-01T03:00:00.000Z"),
    endAt: new Date("2026-04-30T02:59:59.000Z"),
    autoApprove: true,
  },
  {
    name: "Alimentação Balanceada Diária",
    description: "Registro diário de alimentação saudável. Importado da plataforma antiga.",
    pointsValue: 10,
    startAt: new Date("2025-12-01T03:00:00.000Z"),
    endAt: new Date("2026-04-30T02:59:59.000Z"),
    autoApprove: true,
  },
  {
    name: "Autoestima em Alta - Selfies Diárias",
    description: "Selfie diária para cultivar autoestima. Importado da plataforma antiga.",
    pointsValue: 10,
    startAt: new Date("2025-12-01T03:00:00.000Z"),
    endAt: new Date("2026-04-30T02:59:59.000Z"),
    autoApprove: true,
  },
  {
    name: "Desafio de Natal – Natal em Voz Alta",
    description: "Desafio sazonal de natal com atividades diárias. Importado da plataforma antiga.",
    pointsValue: 10,
    startAt: new Date("2025-12-10T03:00:00.000Z"),
    endAt: new Date("2025-12-25T02:59:59.000Z"),
    autoApprove: true,
  },
];

// ─── Main ────────────────────────────────────────────────────
async function main() {
  console.log("🔄 Importing legacy data...\n");

  const dataDir = join(process.cwd(), "dados_plataforma_antiga");
  const membrasPath = join(dataDir, "perfis_membras.csv");
  const checkinsPath = join(dataDir, "historico_checkins_membras.csv");

  // ── 1. Read & deduplicate membras ───────────────────────
  console.log("📋 Reading membras CSV...");
  const rawMembraRows = readMembas(membrasPath);
  console.log(`   Raw rows: ${rawMembraRows.length}`);

  const membras = deduplicateMembas(rawMembraRows);
  console.log(`   After dedup: ${membras.length} unique membras\n`);

  // ── 2. Create/update Rituals ─────────────────────────────
  console.log("🏛️  Ensuring rituals exist...");
  const ritualMap = new Map<string, string>();

for (const def of RITUAL_DEFINITIONS) {
  const existing = await prisma.ritual.findFirst({ where: { name: def.name } });
  if (existing) {
    ritualMap.set(normalizeRitualName(def.name), existing.id);
    console.log(`  ⏭️  Ritual exists: ${def.name}`);
  } else {
    const ritual = await prisma.ritual.create({ data: def });
    ritualMap.set(normalizeRitualName(def.name), ritual.id);
    console.log(`  ✅ Created ritual: ${def.name}`);
    }
  }
  console.log("");

  // ── 3. Upsert Users + Profiles ──────────────────────────
  console.log("👤 Upserting users & profiles...");
  const userMap = new Map<string, string>();

  for (const m of membras) {
    const nivel = m.nivel.toLowerCase();
    const role: Role = nivel === "admin" ? Role.ADMIN : Role.MEMBER;
    const name = m.displayName || m.fullName || null;
    const baseSlug = name ? nameToBaseSlug(name) : null;

    const existingUser = await prisma.user.findUnique({ where: { email: m.email } });

    if (existingUser) {
      userMap.set(m.email, existingUser.id);

      await prisma.user.update({
        where: { id: existingUser.id },
        data: { name: m.displayName || m.fullName || undefined },
      });

      await prisma.profile.upsert({
        where: { userId: existingUser.id },
        update: {
          displayName: m.displayName || undefined,
          profession: m.profissao || undefined,
          city: m.cidade || undefined,
          state: m.estado || undefined,
          instagram: m.instagram || undefined,
          bio: m.biografia || undefined,
          interests: m.interesses.length > 0 ? m.interesses : undefined,
          birthday: m.dataAniversario || undefined,
          onboardingComplete: true,
        },
        create: {
          userId: existingUser.id,
          displayName: m.displayName || null,
          profession: m.profissao || null,
          city: m.cidade || null,
          state: m.estado || null,
          instagram: m.instagram || null,
          bio: m.biografia || null,
          interests: m.interesses,
          birthday: m.dataAniversario,
          onboardingComplete: true,
        },
      });

      console.log(`   ⏭️  User exists: ${m.email}`);
    } else {
      let slug = baseSlug || "membro";

      if (slug) {
        const slugTaken = await prisma.user.findUnique({ where: { slug } });
        if (slugTaken) {
          let counter = 1;
          while (counter < 1000) {
            const candidate = `${slug}-${counter}`;
            const candidateTaken = await prisma.user.findUnique({ where: { slug: candidate } });
            if (!candidateTaken) {
              slug = candidate;
              break;
            }
            counter++;
          }
          if (counter >= 1000) {
            const random = Math.random().toString(36).slice(2, 6);
            slug = `${slug}-${random}`;
          }
        }
      }

      const user = await prisma.user.create({
        data: {
          email: m.email,
          name,
          slug,
          role,
          profile: {
            create: {
              displayName: m.displayName || null,
              profession: m.profissao || null,
              city: m.cidade || null,
              state: m.estado || null,
              instagram: m.instagram || null,
              bio: m.biografia || null,
              interests: m.interesses,
              birthday: m.dataAniversario,
              onboardingComplete: true,
            },
          },
        },
      });

      userMap.set(m.email, user.id);
      console.log(`   ✅ Created user: ${m.email} (${slug})`);
    }
  }
  console.log("");

  // ── 4. Import Points Balance ─────────────────────────────
  console.log("💰 Importing points balance...");
  let pointsCount = 0;

  for (const m of membras) {
    if (m.pontuacao <= 0) continue;
    const userId = userMap.get(m.email);
    if (!userId) continue;

    try {
      await prisma.pointsLedger.create({
        data: {
          userId,
          ruleKey: "IMPORTED_BALANCE",
          points: m.pontuacao,
          sourceType: "import",
          sourceId: "legacy-balance",
        },
      });
      pointsCount++;
      console.log(`   ✅ Points: ${m.email} → ${m.pontuacao}`);
} catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === "P2002") {
        console.log(`    ⏭️  Points already imported: ${m.email}`);
      } else {
        throw e;
      }
    }
  }
  console.log(`  Total points entries: ${pointsCount}\n`);

  // ── 5. Read & import checkins ───────────────────────────
  console.log("📝 Reading checkins CSV...");
  const checkinRows = readCheckins(checkinsPath);
  console.log(`   Total checkin rows: ${checkinRows.length}\n`);

  console.log("📥 Importing checkins & presence...");
  let checkinCount = 0;
  let checkinSkipped = 0;
  let presenceCount = 0;

  for (const c of checkinRows) {
    let userId = userMap.get(c.userEmail);

    if (!userId) {
      const existingUser = await prisma.user.findUnique({ where: { email: c.userEmail } });
      if (existingUser) {
        userId = existingUser.id;
        userMap.set(c.userEmail, existingUser.id);
      } else {
        const name = c.userName || null;
        const baseSlug = name ? nameToBaseSlug(name) : "membro";
        let slug = baseSlug;
        const slugTaken = await prisma.user.findUnique({ where: { slug } });
        if (slugTaken) {
          let counter = 1;
          while (counter < 1000) {
            const candidate = `${slug}-${counter}`;
            if (!(await prisma.user.findUnique({ where: { slug: candidate } }))) {
              slug = candidate;
              break;
            }
            counter++;
          }
        }

        const user = await prisma.user.create({
          data: {
            email: c.userEmail,
            name,
            slug,
            role: Role.MEMBER,
            profile: { create: { onboardingComplete: true } },
          },
        });
        userId = user.id;
        userMap.set(c.userEmail, user.id);
        console.log(`   ✅ Auto-created user from checkin: ${c.userEmail} (${slug})`);
      }
    }

    const ritualId = ritualMap.get(normalizeRitualName(c.desafio));
    if (!ritualId) {
      console.log(`   ⚠️  Unknown ritual: ${c.desafio}, skipping checkin`);
      checkinSkipped++;
      continue;
    }

    if (!c.dataCheckin) {
      console.log(`   ⚠️  Invalid date for checkin: ${c.userEmail} / ${c.desafio}, skipping`);
      checkinSkipped++;
      continue;
    }

    const existingCheckin = await prisma.ritualCheckIn.findFirst({
      where: {
        userId,
        ritualId,
        localDate: c.dataCheckin,
      },
    });

    if (existingCheckin) {
      checkinSkipped++;

      const existingPresence = await prisma.presenceLedger.findUnique({
        where: {
          userId_type_sourceType_sourceId: {
            userId,
            type: "ROUTINE",
            sourceType: "ritual_checkin",
            sourceId: existingCheckin.id,
          },
        },
      });

      if (!existingPresence) {
        await prisma.presenceLedger.create({
          data: {
            userId,
            type: "ROUTINE",
            sourceType: "ritual_checkin",
            sourceId: existingCheckin.id,
          },
        });
        presenceCount++;
      }

      continue;
    }

    const checkIn = await prisma.ritualCheckIn.create({
      data: {
        ritualId,
        userId,
        text: c.observacao || null,
        localDate: c.dataCheckin,
        isCounted: true,
        status: "APPROVED",
      },
    });
    checkinCount++;

    try {
      await prisma.presenceLedger.create({
        data: {
          userId,
          type: "ROUTINE",
          sourceType: "ritual_checkin",
          sourceId: checkIn.id,
        },
      });
      presenceCount++;
    } catch (e: unknown) {
      const err = e as { code?: string };
    if (err.code !== "P2002") throw e;
    }
  }

  console.log(` ✅ Checkins created: ${checkinCount}`);
  console.log(` ⏭️ Checkins skipped (existing/invalid): ${checkinSkipped}`);
  console.log(` ✅ Presence entries: ${presenceCount}\n`);

  // ── Summary ─────────────────────────────────────────────
  console.log("═══════════════════════════════════════════");
  console.log("🎉 Import completed!");
  console.log(`   Users: ${membras.length}`);
  console.log(`   Rituals: ${RITUAL_DEFINITIONS.length}`);
  console.log(`   Points entries: ${pointsCount}`);
  console.log(`   Checkins created: ${checkinCount}`);
  console.log(`   Presence entries: ${presenceCount}`);
  console.log("═══════════════════════════════════════════");
}

main()
  .catch((e) => {
    console.error("❌ Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
