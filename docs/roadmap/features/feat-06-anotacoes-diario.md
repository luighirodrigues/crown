# Feature 06 — Sistema de Anotacoes / Diario

## Resumo
Adicionar uma area de anotacoes privadas chamada "Diario do Reino" onde a membra pode registrar seus pensamentos, metas, reflexoes de rituais e missoes, de forma totalmente privada e segura.

## Problema / Oportunidade
- Rituais e missoes sao publicos (check-ins visiveis), mas a jornada pessoal, metas e reflexoes sao privadas.
- Sem um espaco para anotar pensamentos, a usuaria perde a oportunidade de auto-reflexao que o processo de empreendedorismo exige.
- Os dados do usuario sao valiosos: entender suas metas pode ajudar a personalizar a experiencia da plataforma.
- Um diario com prompts (sugestoes de escrita) guia a usuaria a refletir sobre missoes, rituais e cursos.

## Descricao Tecnica

### Modelo de Dados (Prisma)
```prisma
model DiaryEntry {
  id        String   @id @default(cuid())
  userId    String
  title     String?
  body      String   @db.Text
  mood      String?  // "Happy", "Focused", "Overwhelmed", "Inspired", "Tired", etc.
  tags      String[] // Tags personalizadas: "#meta-semana", "#ritual-da-manha", etc.
  ritualId  String?  // Linka ao ritual relevante, se houver
  missionId String?  // Linka a missao relevante, se houver
  courseId  String?  // Linka ao curso relevante, se houver
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  ritual  Ritual?  @relation(fields: [ritualId], references: [id])
  mission Mission? @relation(fields: [missionId], references: [id])
  course  Course?  @relation(fields: [courseId], references: [id])
}
```

### Paginas e Funcionalidades
1. **Meu Diario** (`/diario`):
   - Lista de entradas organizadas por data (mais recente primeiro).
   - **Timeline Vertical estilizada**: Visual de "sua jornada" com marcos e cores de humor.
   - Filtro por tags, ritual, missao, ou curso.
   - Cards com resumo e humordo dia (pequeno emoji + cor).
2. **Nova Entrada** (`/diario/nova`):
   - Editor de rich text simples (titulo, corpo, negrito, listas, quotes).
   - Seletor de humor com 5 emojis e nomes.
   - Campo de tags (autocomplete com tags anteriores).
   - **AI Prompt (opcional)**: Um botao que gera um prompt de escrita baseado no que a usuaria fez na semana (ex: "Refletindo sobre os rituais da semana...").
3. **Visualizacao** (`/diario/[id]`):
   - Layout leitura (reunido, fonte grande, sem distracoes).
   - Link para contexto (ritual, missao, curso) se houver.
   - Botoes de editar e excluir.
4. **Insights do Diario** (na pagina `/meu-reino`):
   - Word cloud do diario com palavras mais frequentes (ex: "metas", "foco", "produtividade").
   - Grafico de humor ao longo do mes (emocao tracking).
   - Streak de dias seguidos escrevendo (gamificaçao).

### Tech Stack
- `react-simplemde-editor` ou `lexical` (richeditor basico).
- `date-fns` para formatacao de datas.
- `framer-motion` para animacao da timeline.
- `react-tag-input` para adicionar tags.
- Opcional: `wordcloud2.js` para word cloud.

## Referencias
- Notion (para design de editor e thoughts).
- Reflect (reflect.app) — diario digital com AI.
- Diario de gratidao apps (Five Minute Journal).

## Prioridade: Media
