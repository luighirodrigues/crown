# CROWN — Tech Spec v0 (Next.js + Prisma + Postgres)

## 1) Objetivo do documento
Definir tecnologias, padrões e decisões de arquitetura para desenvolver a plataforma CROWN, garantindo consistência para implementação por agentes/IA.

---

## 2) Stack base (confirmada)
- **Fullstack:** Next.js (App Router)
- **ORM:** Prisma
- **Banco:** PostgreSQL
- **Infra:** VPS + EasyPanel
- **Timezone de negócio:** America/Sao_Paulo (Horário de Brasília)

---

## 3) Monorepo vs “tudo no Next”
### Recomendação (v0 / MVP): **tudo no Next (single repo)**
Para o estágio atual, **um único app Next fullstack** tende a ser melhor porque:
- reduz complexidade de deploy (1 artefato)
- facilita usar Server Actions/Route Handlers com o Prisma
- deixa RBAC e middleware de auth centralizados
- é mais rápido para iterar UI + API juntos

### Quando viraria monorepo
Considere monorepo (web + api separados) quando:
- você quiser escalar o backend como serviço independente
- tiver múltiplos clientes (apps) consumindo a mesma API
- precisar de filas/workers separados com consumo alto
- quiser separar domínio “admin”/“member” em apps distintos

**Decisão v0:** Single repo Next.js (fullstack).

**Estrutura sugerida:**
- `/app` (rotas e páginas)
- `/app/api` (route handlers)
- `/src` (domínio, services, libs, UI components)
- `/prisma` (schema + migrations)

---

## 4) Auth e controle de acesso (RBAC)
### Escolha
- **Auth:** NextAuth.js (Auth.js)
- **Primeiro login:** **Magic Link** (email)

### Requisitos
- Roles: `MEMBER`, `ADMIN`, `MODERATOR`
- Proteção por rota (middleware / server guards)
- UI do Admin e do Member no mesmo app (por role)

### Diretrizes
- Todas as rotas/admin precisam de role `ADMIN` ou `MODERATOR`
- Moderador: foco em aprovações/moderação (futuro), mas já modelar role.

---

## 5) Provisionamento via webhooks (assinatura externa)
### Provider
- Plataforma externa: **Lastlink** (eventos exatos ainda a definir)

### Requisitos
- Endpoint seguro para receber webhooks
- Logs persistidos
- Idempotência (evitar processar evento duplicado)

### Padrões técnicos (v0)
- Criar tabela `WebhookEventLog` com:
  - `provider`, `eventId`, `receivedAt`, `payloadJson`, `signatureValid`, `processedAt`, `status`
- Idempotência por `(provider, eventId)` (unique)
- Processamento:
  - criar/ativar membro
  - manter acesso para assinantes ativos
  - cancelar/suspender acesso quando necessário (quando eventos forem definidos)

> **TODO:** Mapear os eventos oficiais da Lastlink e o método de assinatura/verificação.

---

## 6) Persistência (Postgres) + Prisma
### Diretrizes
- Todos os registros com `createdAt`, `updatedAt`
- Datas armazenadas em UTC; regras de “dia”/períodos calculadas em Brasília
- Para rituais/check-ins: armazenar também `localDate` (date) baseado em Brasília

### Entidades principais (v0)
- `User`, `Profile`
- `Channel`, `Post`, `Comment`, `Like`
- `Ritual`, `RitualCheckIn`
- `Mission`, `MissionCompletion`
- `Event`
- `Course`, `CourseLesson`, `CourseProgress`
- `Notification`
- `PointsRule` (config admin)
- `PointsLedger` (extrato de tributos)
- `PresenceLedger` (presenças geral/rotina)
- `WebhookEventLog`

---

## 7) Storage (v0)
### Decisão v0
- **Storage local** (no servidor/VPS), inicialmente.

### O que vai usar storage
- Avatar / Banner
- Check-in de ritual (foto)
- Evidência de missão (imagem/print)
- Imagem em post (se habilitado)

### Padrão recomendado
- Salvar arquivos em diretório do servidor (ex: `/data/crown/uploads`)
- No banco, salvar **apenas URL/path + metadata**
- Criar um route handler de download seguro (ou servir via nginx) com:
  - validação de acesso quando necessário

> Observação: storage local é ótimo no começo, mas no futuro você pode migrar para R2/S3 sem mudar o modelo: só troca o “storage adapter”.

---

## 8) UI / CSS
- Recomendado: **Tailwind CSS**
- Design tokens e padrões no arquivo: `CROWN_UI_Guideline_v0.md`
- Componentização mínima:
  - `Card`, `Chip`, `PostCard`, `EventItem`, `RitualCard`, `MissionCard`, `Badge`, `Tabs`

---

## 9) Aprovações (workflow)
Itens aprováveis:
- `MissionCompletion`
- `RitualCheckIn` (quando `autoApprove=false`)

Status:
- `PENDING | APPROVED | REJECTED`

Regras:
- Se `autoApprove=true`: contabiliza na hora
- Se `autoApprove=false`: **só contabiliza tributos/presenças no APPROVED** (evita pontos “fantasmas”)

Campos de auditoria:
- `reviewedByUserId`, `reviewNote`, `reviewedAt`

Visibilidade:
- Fila de aprovação no Admin/Moderador
- Status visível no lado do Membro (com motivo)

---

## 10) Pontos e presenças (engine)
### Tributos
- Config admin via `PointsRule`
- Regra confirmada: **curtida não gera tributo**
- Eventos que podem gerar tributo (configuráveis):
  - criar post, comentar, check-in ritual, missão, curso/aula, lições

Persistência:
- `PointsLedger` (um registro por ganho) com idempotência por `sourceType+sourceId+ruleKey`

### Presenças (2 métricas)
- `PresenceLedger` com tipo:
  - `GENERAL` (qualquer ação relevante, inclusive like)
  - `ROUTINE` (eventos e rituais)

---

## 11) Consultas principais (mural/ranking)
- “O que está acontecendo agora”: **próximos 3 eventos**
- “Contribuições do reino”: **posts dos últimos 7 dias** ordenados por **likes**
- Ranking mensal:
  - baseado **somente em tributos**
  - membro vê apenas mês atual
  - admin/mod pode escolher mês

Índices recomendados:
- `Post(createdAt)`, `Post(channelId, createdAt)`
- `Like(postId)`, `Comment(postId, createdAt)`
- `RitualCheckIn(userId, ritualId, localDate)`
- `PointsLedger(userId, createdAt)` e `PointsLedger(createdAt)`
- `WebhookEventLog(provider, eventId)` unique

---

## 12) Notificações (in-app)
- Persistir em `Notification` (lida/não lida)
- Gatilhos:
  - curtida/comentário/resposta
  - status de aprovação (approved/rejected + motivo)
  - eventos criados/atualizados
- Push/email: futuro (não necessário no v0)

---

## 13) Deploy e ambiente
### Decisão
- **VPS + EasyPanel**
- Postgres instalado na própria VPS
- Storage local na VPS (uploads)

### Variáveis de ambiente (mínimas)
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (magic link)
- `WEBHOOK_LASTLINK_SECRET` (quando definido)
- `UPLOADS_DIR=/data/crown/uploads` (sugestão)

---

## 14) Padrões de código
- TypeScript estrito
- Zod para validação de inputs e webhooks
- ESLint + Prettier
- Migrations via Prisma
- Separar domínio em `services/` (regras de negócio) e `repositories/` (prisma)

---

## 15) Pendências (TODO)
- Mapear eventos + assinatura/verificação do webhook da **Lastlink**
- Decidir se posts aceitam imagem no v0 (sim/não)
- Política de moderação: remoção/edição de posts e comentários (admin/mod)
- Estratégia de backups (Postgres + uploads) na VPS
