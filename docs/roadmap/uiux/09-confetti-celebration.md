# 09 — Confetti Celebration em Ações

## Resumo
Implementar um sistema de confetti dourado e personalizado que dispara em momentos de celebracao: quando um usuario completa um ritual, termina uma missao, sobe de posicao no ranking, ou atinge uma meta. O confetti deve combinar cores da marca (dourado, roxo profundo, branco) e ser subtil, nao intrusivo.

## Problema / Oportunidade
- A plataforma Crown tem um sistema de gamificacao (Tributos, Ranking, Rituais), mas nao ha celebracao visual em momentos de conquista.
- Sem feedback de celebracao, as recompensas parecem pouco gratificantes.
- Outras plataformas de gamificacao (Duolingo, Strava) investem pesado em micro-celebracoes.
- Confetti tem uma baixa barreira de implementacao e alto retorno em percepção de satisfacao do usuario.

## Descricao Tecnica
- Instalar a lib `canvas-confetti` que permite criar efeitos de confetti via canvas
- Criar um service `celebration.service.ts` com funcoes reutilizaveis:
  - `fireConfetti(options)` — basico
  - `fireCrownConfetti()` — com icones de coroa e cores da marca
  - `fireRankingBoost(targetElement)` — dispara do elemento especifico
  - `fireMissionComplete()` — mix de cores, maior duracao
- Integrar nos eventos de gamificacao:
  - `RitualCard` — on successful check-in
  - `MissionCard` — on mission approval/completion
  - `RankingItem` — quando o usuario subir de posicao no ranking
  - `ProfilePage` — ao atingir marcas de Tributos (100, 500, 1000...)
- Customizar confetti para usar particulas em forma de estrelas, diametes e coroas (via shapes customizadas do canvas-confetti).
- Implementar `prefers-reduced-motion` disable.
- Performance: usar um canvas overlay unico e global em vez de multiplos, utilizar `requestAnimationFrame` e limitar a 3 segundos de duracao maxima.
- Garantir que o confetti nao quebra o layout com z-index adequado.

## Exemplo de implementacao
```tsx
import confetti from 'canvas-confetti';

// No componente RitualCard
const handleCheckin = async () => {
  await submitCheckin();
  
  // Fire confetti from the card position
  const rect = cardRef.current.getBoundingClientRect();
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { 
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: (rect.top + rect.height / 2) / window.innerHeight
    },
    colors: ['#FFD700', '#C0A16B', '#9B8AC8'], // Dourado e roxo
    shapes: ['circle', 'star'],
    gravity: 1.2,
    scalar: 1.2
  });
};
```

## Referencias
- https://www.npmjs.com/package/canvas-confetti
- https://confettijs.org/
- Duolingo reward animations

## Prioridade: Baixa
