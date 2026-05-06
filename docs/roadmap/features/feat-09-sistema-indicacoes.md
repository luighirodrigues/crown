# Feature 09 — Programa de Indicacoes / Convites

## Resumo
Adicionar um sistema de indicacoes e convites onde membros ganham recompensas por convidar novas empreendedoras para a plataforma, com rastreamento de codigo, recompensas por milestones e ranking de indicadores.

## Problema / Oportunidade
- Crescimento organico e o melhor canal de aquisicao de usuaria para comunidades.
- Hoje nao ha incentivo formal para membros convidarem outras.
- Programas de indicacao gamificados (Duolingo, Dropbox, PayPal) sao eficientes.
- A plataforma uniforms payments no futuro; indicacoes sao um canal de growth zero-custo.

## Descricao Tecnica

### Modelo de Dados (Prisma)
```prisma
model ReferralCode {
  id        String   @id @default(cuid())
  userId    String   @unique
  code      String   @unique // Ex: "LUISA20" (baseado no nome + hash)
  totalUsed Int      @default(0)
  createdAt DateTime @default(now())

  user     User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  referred ReferralUse[]
}

model ReferralUse {
  id          String   @id @default(cuid())
  referralCodeId String
  referredUserId String   @unique
  status      String   @default("PENDING") // PENDING, CONVERTED
  createdAt   DateTime @default(now())

  referralCode ReferralCode @relation(fields: [referralCodeId], references: [id])
  referredUser User         @relation(fields: [referredUserId], references: [id])
}

model ReferralReward {
  id          String   @id @default(cuid())
  userId      String
  milestone   Int      // 1, 5, 10... quais convites
  rewardType  String   // "BADGE", "POINTS", "PREMIUM"
  rewardValue   String   // quantidade ou nome do badge
  claimed     Boolean  @default(false)
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Paginas e Funcionalidades
1. **Meus Convites** (`/convites`):
   - Meu codigo unico de convite (ex: "MARIA10").
   - Buttons para copiar link, compartilhar no WhatsApp/Telegram.
   - Contador de indicacoes (X pessoas convidadas, Y convertidas).
   - **Etapas do Funil**: Visualizacao passo-a-passo: Enviou -> Cadastrou -> Ativou (check-in).</li>
   - Recompensas pendentes e conquistas.
2. **Pagina de Cadastro com Codigo** (`/auth/signin?ref=MARIA10`):
   - Codigo auto-preenchido no formulario.
   - Cadastro convencional, mas marca referencia no banco.
3. **Recompensas por Indicacao:
   | Milestone | Recompensa |
   |-----------|-----------|
   | 1 convidada | Badge "Embaixadora" (Bronze) + 50 Tributos |
   | 5 convidadas | Badge "Influencer do Reino" (Prata) + 200 Tributos |
   | 10 convidadas | Badge "Rainha da Comunidade" (Ouro) + 500 Tributos |
   | 25 convidadas | Badge "Imperatriz" (Diamante) + 1000 Tributos |
4. **Ranking de Indicacoes** (widget publico na home ou `/ranking/convites`):
   - Mostra as 10 rainhas que mais convidaram com avatar, nome e numero de convidados.

### Tech Stack
- `qrcode.react` para gerar QR code do link de convite.
- `framer-motion` para animacao de progresso de etapas.
- API route `/api/referral/[code]` para rastrear click-through.
- `crypto` para gerar codigos amigaveis (baseado no firstName + hash).

## Referencias
- Dropbox Referral (classico: 500MB extra por amigo).
- PayPal "Envie e Ganhe".
- Duolingo Referral Badge.

## Prioridade: Alta
