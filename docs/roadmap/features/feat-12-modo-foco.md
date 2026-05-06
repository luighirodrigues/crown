# Feature 12 — Modo Foco / Pomodoro Coletivo

## Resumo
Criar um modo de foco integrado com timer Pomodoro, sons relaxantes/ambiente, lista de tarefas e sessoes coletivas de estudo/foco, inspirando em Forest, Flip e Focusmate.

## Problema / Oportunidade
- Empreendedoras precisam de foco e produtividade, principalmente quem trabalha de casa.
- Hoje a plataforma e de comunidade e gamificacao, mas nao apoia o "fazimento" de coisas.
- Modo Foco coletivo cria accountability visual e social entre membroas (ver outro pessoas focando ao mesmo tempo).
- Gamifica foco: abrir app da Crown e focar, gerando presenca e tributos.

## Descricao Tecnica

### Modelo de Dados (Prisma)
```prisma
model FocusSession {
  id          String   @id @default(cuid())
  userId      String
  mode        String   // "POMODORO", "DEEP_WORK", "CUSTOM"
  targetMinutes Int    // 25, 50, 90...
  actualMinutes Int?
  notes         String? @db.Text
  status      String   @default("PENDING") // PENDING, COMPLETED, ABORTED
  startedAt   DateTime @default(now())
  completedAt DateTime?
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model FocusGroupSession {
  id          String   @id @default(cuid())
  name        String
  description String?
  startAt     DateTime
  duration    Int      // em minutos (ex: 60)
  maxUsers    Int      @default(20)
  icon        String?  // Emoji de representacao
  createdBy   String
  createdAt   DateTime @default(now())

  participants FocusGroupParticipant[]
}

model FocusGroupParticipant {
  id          String   @id @default(cuid())
  groupSessionId String
  userId      String
  joinedAt    DateTime @default(now())
  completedAt DateTime?

  groupSession FocusGroupSession @relation(fields: [groupSessionId], references: [id])
  user User @relation(fields: [userId], references: [id])

  @@unique([groupSessionId, userId])
}
```

### Paginas e Funcoes
1. **Salao de Foco** (`/foco`):
   - Interface minimalista, limpa, sem distrações.
   - **Timer Pomodoro**: 25/5, 50/10, ou custom (minutos pessoais).
   - **Lista de Tarefas**: Simples (titulo, checkbox, prioridade).
   - **Sons Ambiente**: Playscion de background com opcoes:
     - Chuva
     - Cafe
     - Floresta  
     - Ondas do mar
     - Silencio completo
   - **Estadisticas de Foco**: Total de horas, sessoes, media por dia (barra lateral colorida).
   - **Botao "SOS Foco"**: Quando inciar uma sessao, toda a interface se torna minimalista e omite navegacao inferior (modo "zen"). Para sair, confirma "Tem certeza que quer interromper?"
2. **Sessoes Coletivas** (`/foco/coletivo`):
   - Listagem oficial de sessioes programadas (ex: "Foco Sexta-feira - 10h").
   - Contador de quantas pessoas estao focando AGORA (live via heartbeat).
   - Sala virtual (gravatar/avatar com status "focando/finalizado"):
     - Avatares em grid (sem cameras, so status).
     - Chat (restrito) com reacoes emocionais (emoji motivacionais).
     - Indicador de tempo restante compartilhado.
3. **Gamificacao de Foco**:
   - Completar uma sessao Pomodoro = 10 Tributos + 1 presenca geral.
   - Streak de foco (consecutivo): badge especial.
   - Sessoes coletivas geram mais Tributos (porque sao mais dificeis).
   - "Ranking de Foco" visivel no perfil publico: total de horas.

### Tech Stack
- `react-countdown` ou simples `setInterval` para timer.
- Web Audio API para sons de ambiente.
- `date-fns` para duracoes e timestamps.
- Heartbeat HTTP POST a cada 30s para "online" status em sessoes coletivas.
- `shadcn/ui` + custom CSS para tela minimalista.

## Referencias
- Forest (https://www.forestapp.cc/)
- Flip (https://flip.com/)
- Focusmate (https://www.focusmate.com/)
- Freedom (https://freedom.to/)
- Untitled

## Prioridade: Baixa
