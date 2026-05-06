# Feature 01 — Sistema de Reels / Short-Form Video

## Resumo
Implementar um sistema de video curto (Reels / Stories) dentro da plataforma Crown, onde membros podem criar, consumir e interagir com conteudos em formato vertical full-screen, reforcando o engajamento da comunidade.

## Problema / Oportunidade
- A comunidade atual so tem Posts em formato texto/imagem. Reels/Stories sao o formato de conteudo que mais engaja em redes sociais em 2025.
- Mulheres empreendedoras usam muito Reels no Instagram para networking e vendas.
- Nao ter video curto na plataforma fere o diferencial como um "hub de comunidade exclusivo".
- A competicao por atencao das usuarias esta em TikTok, Instagram Reels e YouTube Shorts — nao na comunidade.

## Descricao Tecnica
### Modelo de Dados (Prisma)
```prisma
model Reel {
  id          String   @id @default(cuid())
  authorId    String
  videoUrl    String   // URL do video (armazenado em S3/Supabase Storage ou Cloudflare Stream)
  thumbnailUrl String?
  caption     String?  @db.Text
  soundName   String?  // Nome do audio/som usado
  duration    Int      // em segundos
  views       Int      @default(0)
  likes       Int      @default(0)
  shares      Int      @default(0)
  isPublished Boolean  @default(true)
  createdAt   DateTime @default(now())

  author      User     @relation(fields: [authorId], references: [id])
  reelLikes   ReelLike[]
  reelComments ReelComment[]
}

model ReelLike {
  id     String @id @default(cuid())
  reelId String
  userId String
  reel   Reel   @relation(fields: [reelId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([reelId, userId])
}

model ReelComment {
  id        String   @id @default(cuid())
  reelId    String
  userId    String
  body      String
  createdAt DateTime @default(now())
  reel      Reel     @relation(fields: [reelId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Fluxo
1. **Gravacao/Upload**: Area dedicada em `/reels` onde a usuaria grava ou faz upload de um video (max 60s), adiciona caption e hashtags.
2. **Feed TikTok-like**: Scroll vertical infinito em `/reels` (ou secao na home). Cada reel preenche a tela.
3. **Interacoes**: Like duplo-tap, comentarios em overlay, compartilhar, salvar.
4. **Perfil**: Aba "Reels" no perfil publico mostrando todos os reels da usuaria.
5. **Descoberta**: Reels dos canais seguidos primeiro, depois recomendacoes baseadas em engajamento.

### Tecnica Frontend
- **Reprodutor Video**: HTML5 `<video>` com `playsInline`, `muted={false}` no hover/tap, `autoPlay` quando visivel no viewport (IntersectionObserver).
- **Scroll**: `swiper` ou `framer-motion` para scroll snapping vertical.
- **Seguranca**: Videos devem ser armazenados com compressao/per-processamento (FFmpeg via API route ou servico como Cloudflare Stream/Mux).

### Integracao
- `/api/reels` — CRUD
- `/api/reels/feed` — Feed personalizado (paginado, limite 10 por batch)
- `/api/reels/{id}/like` — Like toggle
- `/api/reels/{id}/comment` — Comentar

## Referencias
- Instagram Reels, TikTok, YouTube Shorts.
- https://www.w3schools.com/html/html5_video.asp
- https://swiperjs.com/

## Prioridade: Alta
