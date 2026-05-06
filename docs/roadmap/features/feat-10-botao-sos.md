# Feature 10 — Botao SOS / Pedir Ajuda

## Resumo
Adicionar um botao de emergencia ou "SOS" acessivel em toda a plataforma, onde membros podem pedir ajuda rapida da comunidade em momentos de estresse, crise ou quando precisam de uma palmada no ombro virtual.

## Problema / Oportunidade
- Empreendedoras frequentemente enfrentam burnout, solidao e ansiedade.
- Hoje nao ha um mecanismo para sinalizar "preciso de ajuda sem saber como" sem postar publicamente.
- O botao deve ser anonimo, nao-julgante e imediatamente acionavel.
- Combinando com o sistema de badges e gamificacao, dar apoio a uma membra pode gerar reconhecimento.

## Descricao Tecnica

### Modelo de Dados (Prisma)
```prisma
model SOS {
  id          String   @id @default(cuid())
  userId      String
  type        String   // "LISTENING", "ADVICE", "VENT", "URGENT"
  message     String?  @db.Text
  isAnonymous Boolean  @default(true)
  status      String   @default("OPEN") // OPEN, IN_PROGRESS, CLOSED
  createdAt   DateTime @default(now())

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  responses SOSResponse[]
}

model SOSResponse {
  id          String   @id @default(cuid())
  sosId       String
  responderId String
  message     String   @db.Text
  isAnonymous Boolean  @default(true) // Quem respondendo anonimo
  createdAt   DateTime @default(now())

  sos      SOS  @relation(fields: [sosId], references: [id])
  responder User @relation(fields: [responderId], references: [id])
}
```

### Interface e Fluxo
1. **Botao Flutuante** (FAB — Floating Action Button):
   - Visivel em todas as paginas (fixed bottom-right, acima do bottom nav).
   - Formato de coracao/balao de dialogo com coracao dourado/ambar pulsante.
   - Click abre um modal overlay escuro.
2. **Modal de SOS**:
   - Opcoes rapida (sem texto obrigatorio):
     - "Preciso desabafar" (otimos para burn-out e stress)
     - "Preciso de um conselho" (duvidas praticas)
     - "Preciso de ajuda urgente" (mais visivel)
     - "Preciso de incentivo" (quando esta desanimada)
   - Text area adicional opcional (anonimo por padrao, toggle para identificar-se).
   - Botao "Enviar meu SOS" — confirma e alerta a comunidade (com regras de anonimato).
3. **Feed de SOS** (apenas para membros ativos ou moderação):
   - Lista de pedidos recentes, sem identificar quem pediu (anonimo).
   - Cards com tipo, tempo, e botao "Responder".
   - Regras: ninguem sabe quem pediu (membros anonymous); moderadores podem ver identidade real por seguranca.
4. **Minhas Respostas**:
   - Membro que respondeu pode ver seu historico de ajuda e quantas pessoas ajudou.
   - Gamification: badge "Anjo do Reino" para quem respondeu 10+ SOS.
5. **Modo de Comunidade**:
   - Quando um SOS e enviado, notifica membros aleatoriamente (limite 20/mes por membro recebendo alerts) para evitar spam.
   - Moderadores recebem todos.
- Para seguranca: todos os posts moderados a priori, mas publicam antes para rapida ajuda. Regras contra cyberbullying previamente establecidas.

### Tech Stack
- `framer-motion` para pulsar do FAB.
- `date-fns` para "h atras", formatacao.
- `floating-ui` para o popover do modal.
- `zod` validar fields.

## Referencias
- Cais (https://www.cais.co/) — efeito de cercamento de comunidade.
- 7cups (https://www.7cups.com/) — free emotional support via anonymous chat.
- Samaritans (https://www.samaritans.org/)

## Prioridade: Alta
