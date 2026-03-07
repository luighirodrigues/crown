# CROWN — UI Guideline v0 (Mobile)

## 0) Direção visual
- Estética **soft + premium** (clean, leve, feminina, “reino”/coroa sem exagero).
- Fundo claro/creme, cards brancos, detalhes em **bordô/vinho** e **dourado suave**.
- Sensação de “app de comunidade + rotina”, com hierarquia bem clara e bastante respiro.

---

## 1) Paleta de cores (aproximada a partir das telas)

> Extraída de amostras das imagens fornecidas (aproximação). Use como base e ajuste fino se necessário.

### Brand (vinho/bordô)
- `brand.900` **#991220** — header, botões primários, estados ativos
- `brand.800` **#A0081B** — variação mais viva para destaque/hover
- `brand.100` **#B79895** — rosé claro para fundos leves/realces

### Backgrounds e superfícies
- `bg` **#F3EAE3** — fundo principal (creme)
- `bg.alt` **#FFFDF9** — fundo alternativo (off-white quente)
- `surface` **#FFFFFF** — cards, modais, inputs
- `surface.alt` **#F6F6F7** — superfície levemente acinzentada (seções)

### Texto e ícones
- `text.primary` **#15191C** — títulos e textos principais
- `text.secondary` **#7D685D** — metadados, descrições, labels
- `muted` **#CDC8CA** — ícones inativos, placeholders, bordas suaves

### Acentos e estados
- `gold.500` **#F0D094** — coroas, badges, conquistas (usar como detalhe)
- `success.500` **#27A34A** — aprovado/concluído
- `danger.400` **#C0575E** — reprovado/atenção (suave, sem agressividade)

---

## 2) Tipografia
- Fonte: sans moderna (ex.: Inter / system UI).
- Hierarquia:
  - `H1` (tela): 18–20px, semibold
  - `H2` (seções): 16–18px, semibold
  - `Body`: 14–15px regular
  - `Caption/meta`: 12–13px
- Títulos sempre com contraste alto, metadados “soft”.

---

## 3) Grid, espaçamentos e bordas
- Mobile-first (largura ~375).
- Padding padrão de tela: **16px**
- Gap entre cards: **12–16px**
- Radius:
  - cards: **16px**
  - botões/chips: **999px** (pill) ou 12–14px
- Sombra: leve, difusa (nada pesado).
- Bordas: 1px em `muted` com opacidade baixa (bem sutil).

---

## 4) Componentes (biblioteca mínima)

### 4.1 App Header (Topbar)
- Fundo: `brand.900` (vinho)
- Conteúdo: título da tela + ícones (notificações/logout)
- Pode usar gradiente suave (vinho → transparente) em telas como Perfil.

### 4.2 Bottom Navigation (Tab bar)
- Fixada embaixo
- Ícones + label: **Início, Comunidade, Cursos, Rituais, Perfil**
- Estado ativo: `brand.900`, inativo: `muted`

### 4.3 Card base
- Fundo `surface`, radius 16
- Padding 14–16
- Header interno opcional (ex.: autor + data)
- Sempre com respiro e alinhamento consistente

### 4.4 Chips (canais / filtros)
- Formato circular/pill como no print da Comunidade:
  - ícone central
  - label pequeno embaixo
- Ativo: fundo `brand.900`, texto branco
- Inativo: fundo transparente, borda `muted`, texto `text.secondary`

### 4.5 Post Card (Comunidade)
Estrutura:
- Linha autor (avatar + nome + timestamp)
- Título do post (H2)
- Corpo do texto (body)
- Mídia opcional (imagem com radius 14)
- Footer: ações (like, comment, reaction, share/link) + contadores discretos

### 4.6 Listas de eventos (Mural)
- Componente “Evento compacto”:
  - título + data/hora (Brasília)
  - estilo card pequeno (pode usar `bg.alt` como fundo)
- “O que está acontecendo agora”: mostrar **próximos 3**

### 4.7 Missões da semana (Mural)
- Card com título + descrição curta
- À direita botões “Iniciar / Concluir / Status”
- Estados:
  - `PENDING`: badge neutra
  - `APPROVED`: badge `success.500`
  - `REJECTED`: badge `danger.400` + motivo acessível

### 4.8 Ritual Card (Salão dos Rituais)
- Thumbnail grande (imagem) com radius
- Título + subtítulo + período (ex.: Fevereiro)
- CTA: “Fazer check-in” (primário `brand.900`)
- Indicador de progresso opcional (dias/total)

### 4.9 Perfil
- Banner no topo (vinho/gradiente) com botão “Personalizar Banner”
- Avatar circular com borda dourada suave (`gold.500`)
- Badges: “Rainha”, “X tributos”
- Seções em cards:
  - Insígnias/Conquistas (scroll horizontal)
  - História
  - Vozes do Reino
  - Presença no Reino (métricas com ícones)
  - Interesses & Habilidades
  - Histórico de Tributos (empty state elegante)
  - Rituais Concluídos
  - Publicações Recentes
  - Jornada no Reino (timeline)
  - Portfólio & Conquistas (add)

---

## 5) Padrões de estado (UX)
- Empty states: ícone + frase curta + CTA.
- Loading: skeletons em cards.
- Feedback: toasts discretos.
- Confirmação de ações com modais suaves.

---

## 6) Comportamento por tela (replicar igual)

### Início (Mural)
- Header vinho
- Cards em coluna
- Seções: próximos eventos (3), missões da semana, rituais ativos, top rainhas do mês, últimas publicações (top likes 7 dias)
- Tudo em “cards” com títulos e botão “ver mais” quando aplicável

### Comunidade
- Header vinho com botão “+ Novo Post”
- Linha de canais (chips) no topo
- Feed de posts com cards

### Rituais
- Lista por grupos (ex.: Rituais de Fevereiro, Janeiro, Outros)
- Cada ritual com card imagem + CTA check-in

### Perfil
- Banner + avatar + badges
- Seções em cards, com bastante respiro

---

## 7) Tom de microcopy (textos)
- Leve e acolhedor, mas objetivo.
- Termos fixos:
  - “Rainhas”
  - “Tributos”
  - “Presença (Geral / Rotina)”
  - “Rituais”
  - “Missões”
  - “Reino”

---

## 8) Prompt pronto para IA de código (copiar e colar)

> Recrie as telas mobile da CROWN seguindo o “CROWN — UI Guideline v0”. O design é soft/premium com header vinho (**#991220**), fundo creme (**#F3EAE3**), cards brancos (**#FFFFFF**) com radius 16 e detalhes dourado suave (**#F0D094**). Implementar as telas: Início (Mural), Comunidade (canais + feed), Rituais (listas por mês), Perfil (banner + cards de seções). Usar componentes reutilizáveis (Card, Chip, PostCard, EventItem, RitualCard, MissionCard) e manter tipografia e espaçamento consistentes. Bottom navigation com 5 abas. Não inventar novas cores fora dos tokens e manter sombras leves.
