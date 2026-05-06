# Feature 07 — Match-Making entre Membros

## Resumo
Criar um algoritmo de match-making que conecta membros com interesses, habilidades e objetivos complementares, incentivando networking e parcerias de negocios dentro da comunidade.

## Problema / Oportunidade
- Comunidades grandes (hoje ja tem membros) tem o problema de "muita gente, mas nao sei com quem conectar".
- Empreendedoras solitarias precisam de conexoes genuinas, mas nao tem tempo para buscar manualmente.
- Um sistema de match-making automatiza networking, gera valor assimetrio e incentiva visitas diarias ao app.
- Complementa perfeitamente com o marketplace (feat-04) e o chat (feat-05).

## Descricao Tecnica

### Modelo de Dados (Prisma)
```prisma
model MatchProfile {
  id                  String   @id @default(cuid())
  userId              String   @unique
  lookingFor          String[] // "Networking", "Parceria", "Mentoria", "Amizade", "Cliente", "Fornecedor"
  offeredSkills       String[]
  interests           String[]
  businessStage       String?  // "Idea", "MVP", "Crescimento", "Escala"
  availability        String?  // "Tempo integral", "Meio periodo", "Fines de semana"
  preferredMeeting    String?  // "Online", "Presencial", "Hibrido"
  bioMatch            String?  @db.Text // Bio curta para o match
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Match {
  id          String   @id @default(cuid())
  userId1     String
  userId2     String
  score       Int      // 0-100, compatibilidade
  status      String   @default("PENDING") // PENDING, ACCEPTED, DECLINED, BLOCKED
  createdAt   DateTime @default(now())

  user1 User @relation(fields: [userId1], references: [id], onDelete: Cascade)
  user2 User @relation(fields: [userId2], references: [id], onDelete: Cascade)

  @@unique([userId1, userId2])
}
```

### Algoritmo de Match
- Baseado em **compatibilidade de etiquetas**:
  - `skills` vs `lookingFor` (peso 30%)
  - `interests` em comum (peso 20%)
  - Categoria de negocio complementar (peso 25%)
  - Presenca na comunidade (rituais, posts, missoes) (peso 25%)
- Matches sao gerados automaticamente toda semana (cron job ou vercel cron).
- Query para encontrar matches: `calculateCompatibility(userId1, userId2)` -> retorna `score` (0-100).

### Paginas e Funcionalidades
1. **Descoberta de Matches** (`/matches`):
   - Interface estilo Tinder/LinkedIn: cards de usuarias com foto, nome, profissao, interesses e compatibilidade (%).
   - **Swipe esquerdo/direita** em mobile (ou botoes "Ignorar" / "Conectar").
   - **Compatibilidade**: mostra por que voces combinam ("Voces compartilham interesse em Marketing Digital e Redes Sociais").
   - Limitar a 5 matches por dia para evitar spam/fatiga.
2. **Meus Matches** (`/matches/conexoes`):
   - Lista de mutual matches (ambas aceitaram).
   - Botao "Iniciar Conversa" para abrir o chat interno (feat-05).
   - Feed filtrado por "aceitaram", "pendentes".
3. **Setup de Match Profile** (`/perfil/match`):
   - Formulario complementar no perfil:
     - "Estou procurando..." (tags)
     - "Posso oferecer..." (tags)
     - "Meu negocio esta em..." (multi-select)
     - "Disponibilidade" (tags)
     - "Bio para matching"
   - O preenchimento incentiva com tributos (gamificação).

### Tech Stack
- `react-tinder-card` (ou `framer-motion` com drag) para swipe interface.
- Fingerprint de interesses: faixa dos unicos strings.
- `percentage = (tagsInCommon / totalUniqueTags) * 100` -> base simples.
- Vercel Cron para verificacao semanal de matches.

## Referencias
- LinkedIn "Voces talvez conheca".
- Bumble Business (Bumble Bizz).
- Meetup.com matching algo.

## Prioridade: Alta
