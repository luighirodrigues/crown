# CROWN — Especificação Funcional (v0)

## 1) Visão geral

A **CROWN** é uma comunidade para conectar mulheres com objetivos em comum e fortalecer o empreendedorismo entre elas. A plataforma organiza engajamento, rotina e conteúdo por meio de **feed/canais**, **eventos**, **rituais**, **missões** e um sistema de **pontos (Tributos)** + **Presenças**.

---

## 2) Perfis e permissões

### Perfis (roles)
- **Membro**
- **Administrador**
- **Moderador** (previsto; já considerar na arquitetura)

### Permissões (alto nível)
- **Membro**: consumir conteúdos, publicar/comentar/curtir, participar de rituais, concluir missões, ver agenda, receber notificações, editar perfil.
- **Admin**: gerir canais, rituais, eventos, cursos, missões, regras de pontuação, posts fixados, fila de aprovações.
- **Moderador**: (futuro) atuar principalmente em **aprovações** e moderação de conteúdo.

---

## 3) Regras globais

### Timezone
- Toda a aplicação usa **Horário de Brasília (America/Sao_Paulo)** para:
  - datas/horários de posts, comentários e eventos
  - “virada do dia” em rituais e missões
  - filtros por período
  - ranking mensal

---

## 4) Conceitos do sistema

### 4.1 Tributos (pontos)
- **Tributos** são pontos ganhos por ações configuradas.
- **Curtida NÃO gera tributo.**
- Tributos devem ser **mutáveis/configuráveis** pelo Admin.

**Exemplos de ações que podem dar tributo (configuráveis):**
- criar post
- comentar
- check-in em ritual
- completar missão
- completar aulas/curso
- lições/lessons (lições da semana)

> Recomendação de implementação: manter um **extrato (ledger)** de tributos para auditoria e histórico no perfil.

### 4.2 Presenças (2 métricas)
A CROWN terá **dois tipos de presenças**:

1) **Presença Rotina (pesada)**
- Conta participação em:
  - **Eventos**
  - **Rituais (check-ins)**

2) **Presença Geral**
- Conta engajamento amplo:
  - curtir (mesmo sem tributo)
  - comentar
  - criar post
  - check-in
  - participação em ritual
  - participação em evento
  - outras ações futuras

> Recomendação: manter ledger/registro de presença para consistência e métricas.

---

## 5) Assinatura e entrada (provisionamento)

- A assinatura/entrada é feita por **plataforma externa** (planos mensal/anual).
- Essa plataforma envia **webhooks** para o backend da CROWN.
- O backend processa webhooks para:
  - provisionar acesso (criar/ativar membro)
  - manter acesso (renovações/continuidade)
  - (eventos exatos ainda a definir)

> Recomendação: armazenar **logs de webhook** e tratar eventos de forma extensível.

---

## 6) Módulos do produto

## 6.1 Mural (Home)

### Bloco principal (cards)
- **Mensagem para novas rainhas**: post fixado / onboarding para novas assinantes.
- **O que está acontecendo agora**: mostra **próximos 3 eventos** (título + data/hora + link).
- **Rainhas do mês (Top 3)**: ranking mensal por tributos.
- **Lições da semana**: conteúdos do tipo “lição” que geram tributos (não são rituais).
- **Contribuições do reino**: posts **dos últimos 7 dias**, ordenados por **mais likes** (mostrar apenas algumas).
- **Contribuições recentes**: englobado pela ideia de posts relevantes (recorte, não feed completo).

### Coluna direita (status + widgets)
- **Meu nível atual**: nível/título, posição, tributos, presenças, contribuições, comentários, posts.
- **Próxima missão recomendada**: sugestão de ritual/ missão pendente (ver seção 7).
- **Novas rainhas**: lista de novos membros.
- **Últimos rituais publicados**: atividade recente (check-ins) exibida como “o que está rolando”.
- **Próximo evento**: destaque.
- **Top rainhas do mês (Top 5)**: lista estendida do ranking mensal.
- **Rainhas do reino**: galeria de avatares/fotos de membros.

### Ranking no mural
- **Membros**: visualizam sempre **mês atual**.
- **Admin/Moderador**: podem visualizar ranking por **mês selecionado**.

---

## 6.2 Comunidade (Feed tipo Twitter)

- Feed com **posts**, **comentários** e **curtidas**.
- Estruturado por **canais**.

### Canais
- Atualmente seriam hardcoded, mas o requisito é:
  - Admin deve poder **criar/editar/remover** canais.

### Post fixado
- Admin pode **fixar um post** dentro de um canal.

---

## 6.3 Mural de membros
- Lista de todos os membros (com busca/descoberta).

---

## 6.4 Rituais

### Definição
- Rituais são atividades recorrentes que incentivam consistência.
- Admin cadastra múltiplos rituais.

### Configuração do ritual (Admin)
- nome
- objetivo/descrição
- foto
- quantos tributos vale (config)
- **data de início e data de fim** (ex: 01/02/2026 a 28/02/2026)
- (opcional) `autoApprove` (ver aprovações)

### Check-in (Membro)
- pode incluir texto e/ou foto
- **pode editar e apagar**
- regra crítica: **apenas o primeiro check-in do dia conta** por ritual  
  - ex.: postou 3x no mesmo dia → só o primeiro “contabiliza”

### Validade temporal do check-in
- check-in só é válido se estiver dentro do período do ritual:
  - `startAt <= createdAt <= endAt` (Brasília)

---

## 6.5 Missões

### Definição
- Missões são tarefas (rotina/planejamento/ações internas ou externas).
- Criadas pelo Admin.
- Ex.: “Planejar março”, “Revisar fevereiro”, etc.

### Tipo (modo C)
- **Manual**: membro marca como concluída; pode exigir evidência.
- **Automática**: o sistema conclui por regras (ex: X comentários na semana).
- Futuro: missões que dependem de ações externas (ex: Instagram) usam manual com evidência e/ou fluxo de validação.

### Sugestão de missão recomendada
- recomendar rituais/missões pendentes (seção 7)

---

## 6.6 Cursos (Meus cursos)

- Cursos são cadastrados e consumidos via links externos (ex.: YouTube).
- Admin cadastra:
  - curso (nome, descrição)
  - aulas (links)
- Progresso em cursos pode gerar tributos (configurável).

---

## 6.7 Agenda da Rainha (Eventos)

- Calendário visual de eventos.
- Admin cadastra eventos (título, data/hora, descrição, link).
- Eventos alimentam o mural:
  - “O que está acontecendo agora” = próximos 3

---

## 6.8 Notificações (in-app)

Notificações geradas por:

### Interações
- Curtiram meu post
- Comentaram no meu post
- Responderam meu comentário

### Missões/Rituais (status)
- Item entrou como **PENDING** (aguardando aprovação)
- Item foi **APROVADO**
- Item foi **REPROVADO** (com motivo)

### Eventos
- Novo evento cadastrado
- Evento atualizado
- (futuro) lembrete de evento

### Sistema
- Boas-vindas
- (opcional) avisos relevantes (mudança de regras, etc.)

---

## 6.9 Perfil do membro

### Itens do perfil
- foto, banner, nome
- ranking / nível
- conquistas
- história da rainha
- **extrato de tributos** (histórico de ganhos)
- posts do reino (respostas nas minhas publicações)
- rituais concluídos
- métricas de presença (geral e rotina)
- interesses e habilidades
- publicações recentes
- jornada no reino (timeline)
- portfólio de conquistas (título, link, descrição, imagem opcional)
- **status de aprovações** (pendente/aprovado/reprovado + motivo)

---

## 7) Missão recomendada (lógica)

A “missão recomendada” pode sugerir:

1) **Ritual diário pendente**
- existe ritual ativo hoje e membro ainda não fez check-in hoje

2) **Missões pendentes**
- missões ativas que o membro ainda não concluiu
- priorizar por prazo/competência (se houver)

---

## 8) Aprovações (PENDING → APPROVED/REJECTED)

### Configuração
- Missões e (se desejado) rituais podem ter flag:
  - `autoApprove: true|false`

### Fluxo
- `autoApprove = true`:
  - conclui/aprova imediatamente
  - contabiliza tributos e presenças na hora

- `autoApprove = false`:
  - cria item **PENDING**
  - entra na **fila de aprovação** (Admin/Moderador)
  - membro visualiza status no app
  - ao aprovar:
    - contabiliza **Tributos** e **Presenças**
  - ao reprovar:
    - não contabiliza
    - armazena **motivo** e exibe ao membro

### Regra de contabilização
- Para evitar “pontos fantasmas”:
  - itens `PENDING` **não geram** tributos/presenças
  - tributos/presenças entram **somente na aprovação**

### UX
- **A+B**: pendências aparecem:
  - no **Admin/Moderador** (fila)
  - no **membro** (status + motivo)

---

## 9) Ranking mensal

- Ranking mensal é baseado **somente em Tributos**.
- Exibido no mural:
  - Top 3 e Top 5
- Admin/Moderador pode consultar meses anteriores.

---

## 10) Entidades (modelagem inicial sugerida)

- `User` (role: MEMBER/ADMIN/MODERATOR)
- `Profile` (foto, banner, bio/história, interesses, habilidades)
- `Channel` (admin-crud)
- `Post` (canal, autor, fixado)
- `Comment`
- `Like`
- `Ritual` (startAt/endAt, foto, objetivo, pointsValue, autoApprove)
- `RitualCheckIn` (texto/foto, status, dia, contabilizado?, reviewedBy, reviewNote)
- `Mission` (tipo manual/automática, autoApprove, regra/criteria opcional, período)
- `MissionCompletion` (status, evidence, reviewedBy, reviewNote)
- `Event` (agenda)
- `Course`
- `CourseLesson` (link externo)
- `CourseProgress` (opcional)
- `Notification`
- `PointsLedger` (extrato de tributos)
- `PresenceLedger` (presença geral/rotina)
- `RankingSnapshot` (opcional para performance mensal)

---

## 11) Backlog (épicos iniciais sugeridos)

1) Autenticação + provisionamento por webhook (assinaturas)
2) Comunidade: canais + posts + comentários + likes + post fixado
3) Mural/Home (widgets e consultas: próximos eventos, top posts 7d, ranking)
4) Rituais (CRUD admin + check-in + regra “primeiro do dia” + período)
5) Missões (CRUD admin + manual/auto + recomendação)
6) Aprovações (fila admin/mod + status no membro + motivo)
7) Cursos (CRUD + aulas via link + progresso)
8) Agenda (CRUD eventos + calendário)
9) Notificações in-app (geração + leitura + navegação)
10) Perfil completo (extrato tributos, presenças, jornada, portfólio)
