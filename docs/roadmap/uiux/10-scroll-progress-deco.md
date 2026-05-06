# 10 — Scroll Progress Decoration Bar

## Resumo
Adicionar uma barra de progresso de scroll decorativa no topo da pagina ou ao lado do scroll, utilizando uma cor dourada gradiente que combina com o tema premium da Crown, indicando visualmente a posicao de leitura do usuario.

## Problema / Oportunidade
- A interface nao tem nenhum indicador de progresso de scroll, o que deixa o usuario sem nocao de quanto da pagina falta.
- Em paginas longas como perfil, comunidade e cursos, um indicador de progresso melhora a navegabilidade.
- Portfolio de agencias e plataformas premium frequentemente usam scroll progress bars elegantes.
- E uma feature baixo esforco, alto retorno de UX.

## Descricao Tecnica
- Criar um componente `ScrollProgressBar` que:
  - Escuta o evento `scroll` do `window` via `useEffect`
  - Calcula o progresso: `scrollTop / (scrollHeight - clientHeight)`
  - Atualiza a largura da barra via `transform: scaleX()` para evitar relayouts e garantir performance:
    ```css
    .scroll-progress {
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, #C0A16B, #FFD700, #F7E7CE);
      transform-origin: left;
      z-index: 9999;
      will-change: transform;
    }
    ```
- Variantes de posicionamento:
  - **Top Bar**: Fino (2-3px), dourado gradient, fixo no topo do viewport
  - **Side Ring**: Em desktop/tablet, um anel circular no sidebar que progressivamente preenche `strokeDashoffset`
  - **Post Reading**: Em posts longos, um indicador sutil junto ao botão "voltar ao topo"
- Animar a barra usando `transform: scaleX()` em vez de `width` para GPU-acceleration.
- O gradiente dourado deve ser a mesma paleta utilizada nos icones e no branding, reforcando a identidade visual.
- Adicionar `throttle` no evento de scroll para performance (max 60fps). 
- Opcao: trocar cor quando scroll comeca a reduzir progresso (opcional visual).

## Referencias
- https://developer.mozilla.org/en-US/docs/Web/API/Window/scroll
- https://blog.hubspot.com/website/progress-bar

## Prioridade: Baixa
