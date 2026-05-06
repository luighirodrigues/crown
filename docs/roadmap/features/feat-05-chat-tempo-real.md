# Feature 05 — Chat em Tempo Real entre Membros

## Resumo
Adicionar um sistema de mensagens privadas em tempo real (DMs) e grupos (Squads), permitindo que membros se comuniquem de forma privada dentro da plataforma.

## Problema / Oportunidade
- Membros hoje precisam ir para fora da plataforma (WhatsApp/Instagram) para troca mais privada.
- Sem chat, o engajamento de networking fica restrito a comentarios publicos (post) e check-ins (ritual).
- Preservar conversas dentro da Crown gera dados, cria fidelizacao e mantem usuaria logada.
- Grupos fechados ("Squads") são essenciais para networking intenso e accountability.

## Descricao Tecnica

### Modelo de Dados (Prisma)
```prisma
// Chat & Messages
model Conversation {
  id          String   @id @default(cuid())
  type        String   // "DM" or "GROUP"
  name        String?  // Nome do grupo
  imageUrl    String?  // Foto do grupo
  createdAt   DateTime @default(now())
  
  participants  ConversationParticipant[]
  messages        Message[]
  lastMessageId  String?  @unique
}

model ConversationParticipant {
  id              String       @id @default(cuid())
  conversationId  String
  userId          String
  lastReadAt      DateTime?
  createdAt       DateTime     @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([conversationId, userId])
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  senderId       String
  body           String   @db.Text
  imageUrl       String?  // Suporte a midia
  readAt         DateTime?
  createdAt      DateTime @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender       User         @relation(fields: [senderId], references: [id], onDelete: Cascade)
}
```

### Tecnologia Real-Time
- **Vercel (producao)**: Usar serverless + long-polling ou WebSockets. Recomendado **Pusher** ou **Ably** para chat real-time facil.
- **Self-hosted/Open-source**:Alternativas:
  - **Ably** (https://ably.com/) — facil integracao com Next.js API routes.
  - **Pusher** (https://pusher.com/) — provedor classico, simples.
  - **Supabase Realtime** — se ja usa Supabase, otimizado.
- **Opcao 100% open-source**: Sockit.io + Redis (ioredis) para pub/sub. Mais esforco de infra).

### Paginas
1. **Caixa de Entrada** (`/chat`): Lista de conversas com preview da ultima mensagem, avatar da outra pessoa, timestamp, badge de nao lidas.
2. **Conversa** (`/chat/[id]`):
   - Interface estilo WhatsApp/iMessage com bolhas de mensagem, avatares, timestamps, status (enviado, entregue, lido).
   - Suporte a enviar imagens (drag-and-drop + preview + enviar).
   - "Ellipsis" typing indicator enquanto a outra pessoa digita.
   - Scroll automatico para o bottom do chat.
3. **Nova Conversa**: Buscar membros por nome, clicar para iniciar DM.
4. **Criar Grupo**: Selecionar multiplos membros, dar nome e foto ao grupo.

### Fluxo
- Quando um perfil e visitado, incluir um botao "Enviar Mensagem" que inicia uma DM.
- Notificacoes push internas (badge no icone de chat, toast quando uma mensagem nova chega).
- Moderacao basica: reportar mensagens, bloquear usuario.

### Tech Stack
- `pusher-js` (frontend) / `pusher` (server) para realtime.
- `react-virtuoso` para scroll eficiente em chats longos.
- `date-fns` para formatacao de timestamps.
- `zod` validacao de mensagens.

## Referencias
- WhatsApp, Telegram, Discord.
- https://www.abdul一名男子.com/blog/chating-app-pusher-nextjs

## Prioridade: Alta
