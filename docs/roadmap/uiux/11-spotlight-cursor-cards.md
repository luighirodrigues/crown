# 11 — Spotlight Cursor Cards

## Resumo
Aplicar um efeito de "spotlight" ou raio de luz que acompanha o cursor do mouse sobre cards da interface, revelando um brilho dourado sutil no ponto exato onde o cursor passa, criando um efeito de exploracao interativa.

## Problema / Oportunidade
- Cards estaticos parecem "mortos" na interface, especialmente na area de rituais, missoes e cursos.
- A interacao desktop (mouse) nao tem feedback visual de hover alem de scale ou border color.
- O efeito spotlight reforca o tema de realeza (luz, coroa, brilho) e diz respeito ao "dourado funcionando como destaque".
- E um efeito que nao atrapalha, e puro deleite estetico.

## Descricao Tecnica
- Criar um componente `SpotlightCard` que funciona como wrapper para any card:
  ```tsx
  export default function SpotlightCard({ children }) {
    const handleMouseMove = (e) => {
      const { left, top } = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - left}px`);
      e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - top}px`);
    };

    return (
      <div
        className="spotlight-card group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:border-amber-400/30 hover:bg-white/10
          before:absolute before:rounded-full before:content-['']
          before:left-[var(--mouse-x)] before:top-[var(--mouse-y)]
          before:h-32 before:w-32 before:-translate-x-1/2 before:-translate-y-1/2
          before:bg-amber-400/20 before:blur-2xl before:opacity-0
          before:transition-opacity before:duration-500
          hover:before:opacity-100
        "
        onMouseMove={handleMouseMove}
      >
        {children}
      </div>
    );
  }
  ```
- Em vez de blur, pode-se usar `radial-gradient` com `mask-image` para um efeito mais definido.
- Variacoes por contexto:
  - **RitualCards**: luz dourada mais intensa, com coroas como via shapes
  - **CourseCards**: luz mais suave, branco/dourado
  - **ProfileCards**: luz com toque de roxo (cor secundaria)
  - **PostCards**: luz sutil, para nao competir com conteudo
- Usar CSS custom properties (`--mouse-x`, `--mouse-y`) para posicionar o spotlight, evitando JS expensive re-renders (o brilho e feito via CSS pseudo-elemento).
- Garantir que o efeito seja leve: `will-change` no `::before`, `transform` em vez de `top/left`.
- No mobile (touch), o efeito ativa no centro do card ao tocar ou desativar completamente para performance.

## Referencias
- https://ui.shadcn.com/examples/magic-card
- https://vaul.dev/
- https://aceternity.com/

## Prioridade: Baixa
