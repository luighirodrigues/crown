import type {
  User,
  Profile,
  Channel,
  Post,
  CrownEvent,
  Ritual,
  Mission,
  Course,
  RankingEntry,
  Notification,
  JourneyEvent,
} from "./types";

// ── Helpers ──
const avatar = (seed: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=F3EAE3`;

const ritualImg = (id: number) =>
  `https://images.unsplash.com/photo-${
    [
      "1506905925346-21bda4d32df4",
      "1518241353330-0f7941c2d9b5",
      "1519681393784-d120267933ba",
      "1470071459604-3b5ec3a7fe05",
      "1441974231531-c6227db76b6e",
      "1469474968028-56623f02e42e",
    ][id % 6]
  }?w=400&h=250&fit=crop`;

const courseImg = (id: number) =>
  `https://images.unsplash.com/photo-${
    [
      "1522202176988-66273c2fd55f",
      "1552664730-d307ca884978",
      "1531482615713-2afd69097998",
    ][id % 3]
  }?w=400&h=250&fit=crop`;

// ── Users ──
export const users: User[] = [
  { id: "u1", name: "Luighi", avatarUrl: avatar("luighi"), role: "ADMIN", joinedAt: "2025-06-01" },
  { id: "u2", name: "Alessandra Munhoz", avatarUrl: avatar("alessandra"), role: "MEMBER", joinedAt: "2025-07-15" },
  { id: "u3", name: "Tanize Gabrielle", avatarUrl: avatar("tanize"), role: "MEMBER", joinedAt: "2025-08-01" },
  { id: "u4", name: "Larissa", avatarUrl: avatar("larissa"), role: "MEMBER", joinedAt: "2025-09-10" },
  { id: "u5", name: "Maria Lauren Freitas", avatarUrl: avatar("maria"), role: "MEMBER", joinedAt: "2025-10-20" },
  { id: "u6", name: "Flávia", avatarUrl: avatar("flavia"), role: "MEMBER", joinedAt: "2025-11-01" },
  { id: "u7", name: "Maria", avatarUrl: avatar("maria2"), role: "MEMBER", joinedAt: "2025-12-15" },
  { id: "u8", name: "Teresa", avatarUrl: avatar("teresa"), role: "MEMBER", joinedAt: "2026-01-01" },
  { id: "u9", name: "Carolina", avatarUrl: avatar("carolina"), role: "MEMBER", joinedAt: "2026-01-15" },
  { id: "u10", name: "Beatriz", avatarUrl: avatar("beatriz"), role: "MEMBER", joinedAt: "2026-02-01" },
];

export const currentUser = users[0];

// ── Profile (logged-in user) ──
export const currentProfile: Profile = {
  ...currentUser,
  bannerUrl: undefined,
  bio: "Apaixonada por empreendedorismo feminino e desenvolvimento pessoal. Construindo meu reino, um dia de cada vez. 👑",
  interests: ["Marketing digital", "Branding", "Liderança", "Mindset", "Finanças"],
  skills: ["Design", "Copywriting", "Gestão de projetos", "Social Media"],
  totalTributos: 1247,
  presencaGeral: 87,
  presencaRotina: 72,
  postsCount: 34,
  commentsCount: 89,
  rankPosition: 5,
  badges: [
    { id: "b1", label: "Rainha", icon: "crown", variant: "gold" },
    { id: "b2", label: "1247 tributos", icon: "gem", variant: "brand" },
    { id: "b3", label: "Top 5", icon: "trophy", variant: "gold" },
  ],
  achievements: [
    { id: "a1", title: "Primeira Publicação", description: "Publicou pela primeira vez na comunidade", icon: "pencil", unlockedAt: "2025-06-15" },
    { id: "a2", title: "Ritual de 7 dias", description: "Completou 7 dias consecutivos de ritual", icon: "flame", unlockedAt: "2025-07-22" },
    { id: "a3", title: "Engajadora", description: "50 comentários na comunidade", icon: "message-circle", unlockedAt: "2025-09-01" },
    { id: "a4", title: "Rainha do Mês", description: "Top 3 no ranking mensal", icon: "crown", unlockedAt: "2025-10-01" },
    { id: "a5", title: "Missão Perfeita", description: "Completou todas as missões de um mês", icon: "target", unlockedAt: "2025-11-30" },
  ],
};

// ── Channels ──
export const channels: Channel[] = [
  { id: "ch0", name: "Todos", icon: "layout-grid", slug: "todos", postCount: 156 },
  { id: "ch1", name: "Planejamento", icon: "calendar-check", slug: "planejamento", postCount: 42 },
  { id: "ch2", name: "Revisão", icon: "rotate-ccw", slug: "revisao", postCount: 38 },
  { id: "ch3", name: "Conteúdo Estratégico", icon: "lightbulb", slug: "conteudo-estrategico", postCount: 31 },
  { id: "ch4", name: "Evolução", icon: "trending-up", slug: "evolucao", postCount: 25 },
  { id: "ch5", name: "Datas do Mês", icon: "calendar", slug: "datas-do-mes", postCount: 20 },
];

// ── Posts ──
export const posts: Post[] = [
  {
    id: "p1",
    channelId: "ch1",
    author: users[1],
    title: "Planejei março",
    body: "Já encomendei os mimos que vou dar para as clientes, e esse mês será voltado para reforçar a autoridade e a responsabilidade. Me mostrou todos os procedimentos e como cada um...",
    likeCount: 14,
    commentCount: 3,
    createdAt: "2026-03-02T14:30:00-03:00",
  },
  {
    id: "p2",
    channelId: "ch2",
    author: users[1],
    title: "Revisão de fevereiro",
    body: "Vídeos curtos e resultados acabam tendo mais alcance. A comunicação precisa ser mais direta e focada nos resultados.",
    imageUrl: ritualImg(0),
    likeCount: 11,
    commentCount: 2,
    createdAt: "2026-03-02T10:00:00-03:00",
  },
  {
    id: "p3",
    channelId: "ch3",
    author: users[2],
    title: "Meu conteúdo estratégico.",
    body: "Estou bem ansiosa para o mês de março! Elaborei e ainda estou elaborando uma \"campanha\" alusiva ao dia da mulher, que a estratégia é trazer mais engajamento para meu perfil...",
    likeCount: 8,
    commentCount: 5,
    createdAt: "2026-03-01T16:00:00-03:00",
  },
  {
    id: "p4",
    channelId: "ch1",
    author: users[2],
    title: "Meu planejamento.",
    body: "Acredito que março seja um mês onde a prática do meu trabalho vai render muito, já vinte e dois dias pensando sobre o mês de março e quero dedicar o maior tempo possível para...",
    likeCount: 6,
    commentCount: 1,
    createdAt: "2026-03-01T09:00:00-03:00",
  },
  {
    id: "p5",
    channelId: "ch2",
    author: users[2],
    title: "Revisão de fevereiro.",
    body: "Então, eu considero meu perfil bem visualizado pensando sobre o número de seguidores que eu tenho. O último post que se foi tem uma visualização bem significativa, e é interessante p...",
    likeCount: 5,
    commentCount: 7,
    createdAt: "2026-02-28T20:00:00-03:00",
  },
  {
    id: "p6",
    channelId: "ch3",
    author: users[2],
    title: "Compartilhando.",
    body: "Quero compartilhar com vocês meu espaço, muitas já viram, pois venho falando com bastante frequência 💗 Mas eu achei interessante ter algo como, vlogzin o quanto eu amo Mkt, Au...",
    likeCount: 9,
    commentCount: 4,
    createdAt: "2026-02-28T15:00:00-03:00",
  },
  {
    id: "p7",
    channelId: "ch4",
    author: users[3],
    title: "Evolução!",
    body: "Posso manifestar bastante: estou estudando, errando e acertando. Esses resultados comparado ao meu início está me deixando super feliz! O caminho é longo, mas é aprendendo...",
    likeCount: 12,
    commentCount: 6,
    createdAt: "2026-02-27T11:00:00-03:00",
  },
  {
    id: "p8",
    channelId: "ch5",
    author: users[3],
    title: "",
    body: "Os dados demográficos do público não estão disponíveis para esse período. Selecione o período dos últimos 7 a 28 dias.",
    likeCount: 3,
    commentCount: 1,
    createdAt: "2026-02-27T08:00:00-03:00",
  },
  {
    id: "p9",
    channelId: "ch1",
    author: users[3],
    title: "Meu planejamento para duas semanas de reis! 👑",
    body: "Duas semanas de reis para Março: 1ª - Por trás da Páscoa (bastidores/corflexão) 2ª - O divino preço em dia (educação/autoridade) 3ª - Meditações (educação/autoridade)...",
    likeCount: 15,
    commentCount: 8,
    createdAt: "2026-02-26T14:00:00-03:00",
  },
  {
    id: "p10",
    channelId: "ch5",
    author: users[4],
    title: "Datas de Março",
    body: "• Dia Internacional da Mulher 11 - Dia da Pipoca 15 - Dia mundial do consumidor 17. St patricks day 20 - dia mundial sem carne 20 - Dia da felicidade 20 - início do outono 21 - di...",
    likeCount: 7,
    commentCount: 2,
    createdAt: "2026-02-25T12:00:00-03:00",
  },
  {
    id: "p11",
    channelId: "ch2",
    author: users[4],
    title: "Revisão fevereiro",
    body: "Foi um mês bem melhor que janeiro em relação a faturamento, meu carnaval uma boa porém a última semana do mês sempre tem um movimento interessante...",
    imageUrl: ritualImg(3),
    likeCount: 10,
    commentCount: 3,
    createdAt: "2026-02-25T09:00:00-03:00",
  },
];

// ── Events ──
export const events: CrownEvent[] = [
  {
    id: "e1",
    title: "Encontro Tira-Dúvidas",
    description: "15h00 • Online",
    datetime: "2026-03-04T15:00:00-03:00",
    link: "https://meet.google.com",
    location: "Google Agenda",
  },
  {
    id: "e2",
    title: "Exposição de Empreendedorismo Feminino",
    description: "16h00 • Lócus, Bagé",
    datetime: "2026-03-06T16:00:00-03:00",
    location: "Lócus, Bagé",
  },
  {
    id: "e3",
    title: "Workshop de Branding Pessoal",
    description: "14h00 • Online",
    datetime: "2026-03-10T14:00:00-03:00",
    link: "https://zoom.us",
    location: "Zoom",
  },
  {
    id: "e4",
    title: "Dia da Mulher — Live Especial",
    description: "19h00 • Instagram Live",
    datetime: "2026-03-08T19:00:00-03:00",
    location: "Instagram",
  },
  {
    id: "e5",
    title: "Mentoria em Grupo",
    description: "10h00 • Online",
    datetime: "2026-03-15T10:00:00-03:00",
    link: "https://meet.google.com",
    location: "Google Meet",
  },
];

// ── Rituals ──
export const rituals: Ritual[] = [
  {
    id: "r1",
    name: "Planejei Março",
    description: "Planejamento estratégico para o mês. Defina metas, organize sua agenda e prepare-se para conquistar.",
    imageUrl: ritualImg(0),
    pointsValue: 15,
    startAt: "2026-03-01",
    endAt: "2026-03-31",
    monthLabel: "Março",
    totalDays: 31,
    completedDays: 2,
    autoApprove: true,
  },
  {
    id: "r2",
    name: "Revisão de Fevereiro",
    description: "É hora de revisar. Olhe para trás, analise resultados e extraia aprendizados.",
    imageUrl: ritualImg(1),
    pointsValue: 15,
    startAt: "2026-03-01",
    endAt: "2026-03-07",
    monthLabel: "Março",
    totalDays: 7,
    completedDays: 5,
    autoApprove: true,
  },
  {
    id: "r3",
    name: "Conteúdo Estratégico com Antecedência",
    description: "Escreva um post/ reels/stories de março com antecedência. Construa seu posicionamento e deixa a estrutura pronta.",
    imageUrl: ritualImg(2),
    pointsValue: 20,
    startAt: "2026-03-01",
    endAt: "2026-03-31",
    monthLabel: "Março",
    totalDays: 31,
    completedDays: 1,
    autoApprove: false,
  },
  {
    id: "r4",
    name: "Gratidão Diária",
    description: "Registre 3 coisas pelas quais você é grata hoje. Cultive uma mentalidade de abundância.",
    imageUrl: ritualImg(3),
    pointsValue: 5,
    startAt: "2026-02-01",
    endAt: "2026-02-28",
    monthLabel: "Fevereiro",
    totalDays: 28,
    completedDays: 28,
    autoApprove: true,
  },
  {
    id: "r5",
    name: "Leitura de 15min",
    description: "Dedique 15 minutos à leitura de um livro sobre negócios, desenvolvimento pessoal ou sua área.",
    imageUrl: ritualImg(4),
    pointsValue: 10,
    startAt: "2026-02-01",
    endAt: "2026-02-28",
    monthLabel: "Fevereiro",
    totalDays: 28,
    completedDays: 20,
    autoApprove: true,
  },
  {
    id: "r6",
    name: "Meditação Matinal",
    description: "Comece o dia com 10 minutos de meditação guiada. Encontre seu centro antes de começar.",
    imageUrl: ritualImg(5),
    pointsValue: 10,
    startAt: "2026-01-01",
    endAt: "2026-01-31",
    monthLabel: "Janeiro",
    totalDays: 31,
    completedDays: 31,
    autoApprove: true,
  },
];

// ── Missions ──
export const missions: Mission[] = [
  {
    id: "m1",
    name: "Planejei Março",
    description: "Criar um planejamento importante para março e definir três objetivos claros com estratégias específicas para cada um.",
    type: "MANUAL",
    status: "APPROVED",
    autoApprove: false,
    tributos: 15,
  },
  {
    id: "m2",
    name: "Revisão de Fevereiro",
    description: "Escreva 5 combinações que performaram bem e 1 que não deu tão bem. Baseie-se no que funcionou e o que pode ser melhorado.",
    type: "MANUAL",
    status: "APPROVED",
    autoApprove: false,
    tributos: 15,
  },
  {
    id: "m3",
    name: "Conteúdo Estratégico com Antecedência",
    description: "Escrever um post/ imagens/ reels pronto. Construa seu posicionamento e deixa a estrutura pronta. Argumento proposta é CTA. Comece a criar um app usando o formato.",
    type: "MANUAL",
    status: "PENDING",
    autoApprove: false,
  },
  {
    id: "m4",
    name: "Engajar no Feed 3x",
    description: "Comente em pelo menos 3 posts de outras rainhas na comunidade com comentários construtivos.",
    type: "AUTOMATIC",
    status: "PENDING",
    autoApprove: true,
  },
  {
    id: "m5",
    name: "Check-in de Ritual 7 dias",
    description: "Complete 7 dias consecutivos de check-in em qualquer ritual ativo.",
    type: "AUTOMATIC",
    status: "REJECTED",
    autoApprove: true,
    reviewNote: "Check-ins não foram consecutivos. Tente novamente mantendo a sequência.",
  },
];

// ── Rankings ──
export const rankings: RankingEntry[] = [
  { user: users[5], position: 1, tributos: 2340 },
  { user: users[6], position: 2, tributos: 2180 },
  { user: users[7], position: 3, tributos: 1950 },
  { user: users[1], position: 4, tributos: 1720 },
  { user: users[0], position: 5, tributos: 1247 },
];

// ── Courses ──
export const courses: Course[] = [
  {
    id: "c1",
    name: "Branding Pessoal para Empreendedoras",
    description: "Aprenda a construir uma marca pessoal forte e autêntica que conecta com seu público.",
    imageUrl: courseImg(0),
    lessonCount: 8,
    completedLessons: 5,
  },
  {
    id: "c2",
    name: "Instagram Estratégico",
    description: "Domine as estratégias de conteúdo, engajamento e crescimento no Instagram.",
    imageUrl: courseImg(1),
    lessonCount: 12,
    completedLessons: 3,
  },
  {
    id: "c3",
    name: "Finanças para Mulheres",
    description: "Organize suas finanças pessoais e do negócio com clareza e confiança.",
    imageUrl: courseImg(2),
    lessonCount: 6,
    completedLessons: 0,
  },
];

// ── Notifications ──
export const notifications: Notification[] = [
  { id: "n1", type: "like", title: "Alessandra curtiu seu post", body: "\"Planejei março\"", read: false, createdAt: "2026-03-03T08:00:00-03:00" },
  { id: "n2", type: "comment", title: "Tanize comentou", body: "\"Adorei sua abordagem!\"", read: false, createdAt: "2026-03-02T22:00:00-03:00" },
  { id: "n3", type: "approval", title: "Missão aprovada!", body: "\"Revisão de Fevereiro\" foi aprovada. +15 tributos", read: true, createdAt: "2026-03-02T10:00:00-03:00" },
  { id: "n4", type: "event", title: "Novo evento", body: "Encontro Tira-Dúvidas — 04/mar 15h", read: true, createdAt: "2026-03-01T14:00:00-03:00" },
  { id: "n5", type: "system", title: "Bem-vinda ao CROWN! 👑", body: "Explore a comunidade, participe de rituais e acumule seus tributos.", read: true, createdAt: "2025-06-01T08:00:00-03:00" },
];

// ── Journey / Timeline ──
export const journeyEvents: JourneyEvent[] = [
  { id: "j1", title: "Entrou no Reino", description: "Início da jornada na CROWN", date: "2025-06-01", icon: "log-in" },
  { id: "j2", title: "Primeira Publicação", description: "Publicou pela primeira vez na comunidade", date: "2025-06-15", icon: "pencil" },
  { id: "j3", title: "Ritual de 7 dias", description: "Completou primeiro ritual de 7 dias consecutivos", date: "2025-07-22", icon: "flame" },
  { id: "j4", title: "Top 10 do Mês", description: "Alcançou o ranking mensal de agosto", date: "2025-08-31", icon: "medal" },
  { id: "j5", title: "100 Tributos", description: "Acumulou 100 tributos no total", date: "2025-09-15", icon: "gem" },
  { id: "j6", title: "Rainha do Mês", description: "Top 3 no ranking de outubro", date: "2025-10-31", icon: "crown" },
  { id: "j7", title: "1000 Tributos", description: "Marca histórica de 1000 tributos", date: "2026-01-20", icon: "trophy" },
];
