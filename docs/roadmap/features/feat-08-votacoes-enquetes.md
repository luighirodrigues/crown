# Feature 08 — Sistema de Votacoes e Enquetes

## Resumo
Adicionar a capacidade de criar enquetes e votacoes dentro da comunidade, permitindo que membros e admins pesquisem opinioes, decidam temas e engajem democraticamente.

## Problema / Oportunidade
- Hoje nao ha um mecanismo facil para sonsultar a comunidade sobre temas, datas, ou preferencias.
- Enquetes aumentam o engajamento passivo (usuarios que nao postam ainda podem votar).
- Dados de votacao geram insights sobre preferencias da comunidade (quais eventos, temas de cursos, etc.).
- Decision-making coletivo reforca o senso de pertencimento e comunidade.

## Descricao Tecnica

### Modelo de Dados (Prisma)
```prisma
model Poll {
  id          String   @id @default(cuid())
  authorId    String
  question    String
  description String?  @db.Text
  imageUrl    String?  // Opcional: imagem na enquete
  endDate     DateTime? // Opcional: quando a enquete fecha
  isPublic    Boolean  @default(true) // Admin-only vs member-visible
  isAnonymous Boolean  @default(false) // Nomes visiveis ou anonimo
  status      String   @default("OPEN") // OPEN, CLOSED
  createdAt   DateTime @default(now())

  author    User       @relation(fields: [authorId], references: [id])
  options   PollOption[]
  votes     PollVote[]
}

model PollOption {
  id     String @id @default(cuid())
  pollId String
  label  String
  order  Int    @default(0)

  poll  Poll       @relation(fields: [pollId], references: [id], onDelete: Cascade)
  votes PollVote[]
}

model PollVote {
  id       String   @id @default(cuid())
  pollId   String
  userId   String
  optionId String
  createdAt DateTime @default(now())

  poll   Poll   @relation(fields: [pollId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  option PollOption @relation(fields: [optionId], references: [id], onDelete: Cascade)

  @@unique([pollId, userId])
}
```

### Paginas e Funcoes
1. **Feed de Votacoes** (`/votacoes`):
   - Cards de enquetes recentes e populares.
   - Indicador de tempo restante.
   - Tipo de voto: unica escolha.
2. **Criar Enquete** (`/votacoes/nova`):
   - Formulario simples: pergunta, descricao, adicionar opcoes (2-10), imagem opcional, data de fim.
   - Validacao: minimo 2 opcoes, max 350 chars de pergunta.
   - Apenas ADMIN e MODERATOR podem criar enquetes.
   - Membros podem criar enquetes se configurado no admin.
3. **Votar** (inline na enquete):
   - Clicar em uma opcao = voto registrado instantaneamente (otimistic update).
   - Visualizacao em tempo real: porcentagens animam ao votar.
   - Mostrar resultado apos votar (ou se data ja expirou).
4. **Estatisticas** (admin):
   - Total de votos, distribuicao.
   - Gera de muitas: ideias para Missoes e Threads.

### Tech Stack
- `framer-motion` para animacao das barras de % ao votar.
- `date-fns` para calculo de tempo restante.
- `zod` para validar votes.
- Componente reutilizavel: `PollCard` com opcoes renderizadas com barras.

## Referencias
- Twitter/X Polls.
- Instagram Poll Sticker (Stories equivalent na Crown).
- Mentimeter (para votacao ao vivo).

## Prioridade: Baixa
