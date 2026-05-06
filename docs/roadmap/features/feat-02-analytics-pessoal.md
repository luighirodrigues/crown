# Feature 02 — Dashboard de Analytics Pessoal

## Resumo
Criar uma tela de "Meu Reino" ou analytics pessoal onde cada membro visualiza sua jornada, estatisticas de engajamento, graficos de Tributos, presenca, rituais completados, com comparacao com a comunidade e metas.

## Problema / Oportunidade
- Usuarios nao tem visibilidade de quao bem estao performando na comunidade.
- Sem feedback quantitativo, a motivacao para participar decai com o tempo.
- Analytics gamificados (estilo Duolingo/Strava/LinkedIn) criam loop de recompensa e engajamento.
- Criar um "dashboard" transmite valor e mostra que a plataforma monitora o progresso do usuario.

## Descricao Tecnica
### Modelo de Dados (Ja Existente – PointsLedger, PresenceLedger)
Ate hoje as tabelas `PointsLedger` e `PresenceLedger` ja armazenam tudo o que precisamos. So precisamos de queries de agregacao.

### Query Exemplo (no service)
```ts
// services/analytics.service.ts
export async function getPersonalAnalytics(userId: string, month: Date) {
  const tributos = await prisma.pointsLedger.groupBy({
    by: ["sourceType"],
    where: { userId, createdAt: { gte: startOfMonth(month), lte: endOfMonth(month) } },
    _sum: { points: true }
  });
  
  const presenca = await prisma.presenceLedger.count({
    where: { userId, type: "ROUTINE" }
  });
  
  return { tributos, presenca, rankingPos, streak };
}
```

### Pagina: `/meu-reino`
Layout premium divido em secoes:
- **Header**: "Meu Reino" com parallax de coroa animada. Salutation personalizada.
- **Streak Counter**: Indicador de dias seguidos de check-in, no estilo Duolingo.
- **Grafico de Tributos**: Recharts ou similar. Grafico de areas com gradient dourado.
- **Presenca Geral/Rotina**: Anel de progresso animado (radial chart).
- **Ranking Pessoal**: Posicao no ranking geral, evolucao mensal.
- **Conquistas Recentes**: Cards de badges (conecta com feat-03).
- **Comparacao com media da comunidade**: Barras lado a lado.
- **Export/Print**: Botao para gerar PDF do "Certificado Reino" do mes.

### Tech Stack
- `recharts` ou `shadcn/ui charts` para graficos interativos.
- `framer-motion` para animacao de numeros (count-up).
- Tailwind com gradientes dourados para destacar numeros importantes.

## Referencias
- Duolingo Profile Stats.
- Strava Dashboard.
- LinkedIn Analytics Dashboard.

## Prioridade: Alta
