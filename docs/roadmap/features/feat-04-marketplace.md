# Feature 04 — Marketplace de Servicos entre Membros

## Resumo
Criar um bazar interno chamado "Feira do Reino" onde membros podem oferecer e encontrar servicos uns das outras (marketing, design, coaching, etc.), fortalecendo a economia interna da comunidade.

## Problema / Oportunidade
- A comunidade e de empreendedoras, mas nao ha uma maneira facil de negociar entre si dentro da plataforma.
- Membros hoje precisam ir para outras redes (WhatsApp, Instagram DM) para fechar servicos, perdendo-se o contexto da comunidade.
- Um marketplace interno incentiva networking, gera valor financeiro entre membros e justifica o custo da comunidade.
- Dados de interacao no marketplace fornecem insights sobre quais skills a comunidade mais precisa.

## Descricao Tecnica

### Modelo de Dados (Prisma)
```prisma
model ServiceListing {
  id          String   @id @default(cuid())
  providerId  String
  title       String
  description String   @db.Text
  category    String   // "Design", "Marketing", "Coaching", "Copy", "Fotografia", "Outro"
  price       Decimal? // Null = "Sob consulta"
  priceType   String   // "Fixo", "Hora", "Pacote", "Sob consulta"
  imageUrls   String[] // Portfolio images
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  provider    User              @relation(fields: [providerId], references: [id], onDelete: Cascade)
  reviews     ServiceReview[]
  inquiries   ServiceInquiry[]
}

model ServiceReview {
  id        String   @id @default(cuid())
  listingId String
  reviewerId String
  rating    Int      // 1-5
  comment   String?
  createdAt DateTime @default(now())

  listing  ServiceListing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  reviewer User           @relation(fields: [reviewerId], references: [id], onDelete: Cascade)
}

model ServiceInquiry {
  id         String   @id @default(cuid())
  listingId  String
  requesterId String
  message    String   @db.Text
  status     String   @default("PENDING") // PENDING, ACCEPTED, DECLINED
  createdAt  DateTime @default(now())

  listing   ServiceListing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  requester User         @relation(fields: [requesterId], references: [id], onDelete: Cascade)
}
```

### Paginas
1. **Feira do Reino** (`/feira`): Grid de servicos com filtros por categoria, preco, avaliacao. Cards mostram: foto do portfolio, titulo, fornecedora, preco, avaliacao (estrelas).
2. **Minhas Ofertas** (`/feira/minhas`): Painel para criar e editar anuncios de servico.
3. **Detalhe do Servico** (`/feira/[id]`):
   - Carousel de imagens do portfolio
   - Descricao completa
   - Perfil do prestador (linka para perfil publico)
   - Botao "Contratar/Solicitar" que abre modal de inquiry
   - Secao de Reviews (com estrelas e comentarios)
4. **Minhas Solicitacoes** (`/feira/solicitacoes`): Gerenciamento de pedidos recebidos/enviados (aceitar, recusar, concluir).

### Fluxo para Usuaria
1. Acessa `/feira` -> vê ofertas.
2. Clica em uma oferta -> ve detalhes e clica "Solicitar".
3. Preencher campos (descricao do projeto, orcamento, prazo).
4. A outra usuaria recebe notificacao e aceita/declina.
5. Apos conclusao, ambas podem deixar review.

### Tech Stack
- `shadcn/ui` Carousel para imagens do portfolio.
- `react-rating` ou componente custom para 5 estrelas.
- `zod` validacao de formularios de inquiry.
- Upload de imagens via supabase-storage ou similar (reusar `ImageUpload` atual).

## Referencias
- Fiverr (https://www.fiverr.com/)
- AirTasker (https://www.airtasker.com/)
- The List (by The Oddfather — marketplace para comunidades)
- Nicheless (community marketplace)

## Prioridade: Alta
