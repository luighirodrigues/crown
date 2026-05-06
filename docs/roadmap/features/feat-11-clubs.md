# Feature 11 — Clubs / Sub-comunidades

## Resumo
Adicionar a capacidade de criar e gerenciar sub-comunidades exclusivas ("Clubs") dentro da Crown, com suas proprias areas de discussao, eventos exclusivos, rituais e cursos.

## Problema / Oportunidade
- A comunidade principal pode ser grande e generica. Clubs permitem nichamento e conexao mais profunda.
- Membros com interesses especificos (ex: "Marketing para Coachs", "Moda Plus Size", "Produtos Digitais") precisam de espacos dedicados.
- Clubs podem ser livres ou pagos (potencializacao de receita no futuro).
- Competing/community platforms (Circle, Skool, Mighty Networks) tem sucesso por causa dessa flexibilidade de subgroups.
- Clubs sao essenciais para uma plataforma de empreendedoras: networking por nicho e temas de negocios.

## Descricao Tecnica

### Modelo de Dados (Prisma)
```prisma
model Club {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String   @db.Text
  imageUrl    String?
  bannerUrl   String?
  type        String   @default("OPEN") // OPEN, APPROVED, PRIVATE
  category    String   // "Negocio", "Lifestyle", "Networking", "Especializado"
  rules       String?  @db.Text
  adminId     String   // Dono/creator
  maxMembers  Int?     // Limitacao de vagas
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  admin       User            @relation(fields: [adminId], references: [id])
  members     ClubMember[]
  posts       ClubPost[]
  events      ClubEvent[]
  rituals     ClubRitual[]
  courses     ClubCourse[]
}

model ClubMember {
  id          String   @id @default(cuid())
  clubId      String
  userId      String
  role        String   @default("MEMBER") // MEMBER, MODERATOR
  status      String   @default("PENDING") // PENDING, APPROVED, REJECTED
  joinedAt    DateTime @default(now())

  club Club @relation(fields: [clubId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([clubId, userId])
}

model ClubPost {
  id        String   @id @default(cuid())
  clubId    String
  authorId  String
  title     String
  body      String   @db.Text
  imageUrl  String?
  createdAt DateTime @default(now())

  club   Club @relation(fields: [clubId], references: [id], onDelete: Cascade)
  author User @relation(fields: [authorId], references: [id], onDelete: Cascade)
}

model ClubEvent {
  id        String   @id @default(cuid())
  clubId    String
  title     String
  datetime  DateTime
  description String? @db.Text
  link      String?
  createdAt DateTime @default(now())

  club Club @relation(fields: [clubId], references: [id], onDelete: Cascade)
}

model ClubRitual {
  id          String   @id @default(cuid())
  clubId      String
  name        String
  description String   @db.Text
  pointsValue Int      @default(0)
  startAt     DateTime
  endAt       DateTime
  createdAt   DateTime @default(now())

  club Club @relation(fields: [clubId], references: [id], onDelete: Cascade)
}

model ClubCourse {
  id        String   @id @default(cuid())
  clubId    String
  courseId  String
  createdAt DateTime @default(now())

  club   Club   @relation(fields: [clubId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
}
```

### Paginas e Funcionalidades
1. **Explorar Clubs** (`/clubs`):
   - Grid de cards de clubs (nome, imagem, categoria, numero de membros).
   - Filtro por categoria e pesquisa por nome.
   - Cards indicam se e Open (entra livre), Approved (entra com aprovacao), ou Private (convite).
   - Badge "Clamshell" favoritos.
2. **Detalhe do Club** (`/clubs/[slug]`):
   - Header com banner, foto, nome, descricao, regras.
   - "Solicitar Entrada" / "Entrar" (dependendo do tipo).
   - - Feed de posts exclusivos do club (similar ao feed principal, mas scoped).
       - Eventos do club com calendario exclusivo.
       - Membros com lista de participantes.
       - Rituais especificos do club.
       - Cursos dedicados ao club.
   - Sidebar lateral com "Regras do Club" e admin list.
3. **Criar Club** (`/clubs/criar`):
   - Formulario com nome deslumbrante, slug, imagens, categoria, tipo, regras.
   - Opcao de limitar membros (premium).
   - Requer mod ou admin.
4. **Gerenciar Meus Clubs** (`/clubs/meus`):
   - Clubes criados e em que participa.
   - Aprovacoes pendentes (quem quer entrar nos seus clubs).
   - Configuracoes de cada club as owner.
5. **Membros do Club** (`/clubs/[slug]/membros`):
   - Lista publica de membros com permissao de privacidade.
   - Moderadores em destaque.

### Tech Stack
- `slugify` para slugs de clubs.
- `shadcn/ui` Tabs para navegacao interna de club (feed, eventos, rituais, membros).
- `framer-motion` para animacao de cards na listagem.
- `date-fns` para calendario.

## Referencias
- Circle
- Mighty Networks
- Skool
- Whatsapp grupos

## Prioridade: Alta
