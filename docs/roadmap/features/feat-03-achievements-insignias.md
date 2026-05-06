# Feature 03 — Sistema de Achievements e Insignias

## Resumo
Criar um sistema de "Condecoracoes do Reino" com badges, titulos e insignias que os membros desbloqueiam ao completar acoes especificas na plataforma, reforcando a gamificacao e criando objetivos a longo prazo.

## Problema / Oportunidade
- O sistema de Tributos e Ranking ja existem, mas faltam milestones visuais e celebrativos entre os marcos.
- Sem conquistas visiveis, a jornada parece linear — precisamos de picos de satisfacao.
- As usuarias precisam de objetivos concretos para continuar engajadas (直到atingir a proxima conquista).
- Compartilhar conquistas nas redes sociais gera atracao de novas membros (marketing organico).

## Descricao Tecnica

### Modelo de Dados (Prisma)
```prisma
model Badge {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String
  iconUrl     String   // SVG ou path de lucide-react
  category    String   // "Ritual", "Missao", "Comunidade", "Curso", "Social"
  tier        String   // "Bronze", "Prata", "Ouro", "Platina", "Diamante"
  condition   Json     // Critérios de desbloqueio (ex: { type: "ritual_count", min: 30 })
  pointsBonus Int      @default(0)
  createdAt   DateTime @default(now())

  userBadges  UserBadge[]
}

model UserBadge {
  id        String   @id @default(cuid())
  userId    String
  badgeId   String
  unlockedAt DateTime @default(now())
  shared    Boolean  @default(false) // Se ja compartilhou nas redes sociais

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  badge Badge @relation(fields: [badgeId], references: [id], onDelete: Cascade)

  @@unique([userId, badgeId])
  @@index([userId, unlockedAt])
}
```

### Badges Exemplo
| Badge | Categoria | Condicao | Tier |
|-------|-----------|---------|------|
| Primeiro Check-in | Ritual | 1 check-in | Bronze |
| Rainha Consistente | Ritual | 7 dias seguidos | Prata |
| Rainha da Rotina | Ritual | 30 dias seguidos | Ouro |
| Mestre dos Rituais | Ritual | 100 check-ins | Platina |
| Missao Cumprida | Missao | 1 missao aprovada | Bronze |
| Missao em Massa | Missao | 10 missoes aprovadas | Prata |
| Primeira Contribuicao | Comunidade | 1 post criado | Bronze |
| Influencer do Reino | Comunidade | 100 likes em posts | Ouro |
| Aluna Dedicada | Curso | 1 curso completado | Bronze |
| Mestre do Conhecimento | Curso | 5 cursos completados | Platina |
| Rainha do Ranking | Ranking | Top 3 em um mes | Ouro |
| Imperatriz do Reino | Ranking | Top 1 em um mes | Diamante |
| Social Butterfly | Social | 1 perfil visitado | Bronze |
| Grande Rede | Social | 50 perfis visitados | Prata |

### Fluxo
1. **Desbloqueio**: Quando uma acao que satisfaz a condicao de um badge e detectada (ex: apos `ritualCheckin.service.ts` registrar o check-in #30, o sistema checa automaticamente), um `UserBadge` e criado e o usuario e notificado.
2. **Notificacao**: Toast especial com animacao de confetti e sombra dourada quando um novo badge e desbloqueado.
3. **Galeria**: Pagina `/conquistas` onde todas as badges sao exibidas:
   - Badges desbloqueadas aparecem em cores vibrantes (dourado, branco)
   - Badges travadas aparecem em cinza/dark com progresso (e.g., "15/30 check-ins")
   - Cada badge tem uma descricao e dica de como desbloquear
4. **Perfil Publico**: As 3 conquistas mais recentes ou mais prestigiosas sao exibidas no perfil publico como destaque.
5. **Share**: Botao de "Compartilhar Conquista" que gera uma imagem PNG pre-renderizada do badge (usando um template simples + html2canvas ou sharp).

### Tech Stack
- `framer-motion` para animacoes de desbloqueio.
- `html2canvas` para gerar imagens de share.
- Canvas ou SVG para progresso radial das badges travadas.

## Referencias
- Gamification: Duolingo, Crunchyroll Badges, Xbox Achievements.
- https://www.gamify.com/

## Prioridade: Alta
