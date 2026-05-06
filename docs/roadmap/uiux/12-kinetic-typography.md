# 12 — Kinetic Typography Hero

## Resumo
Implementar um efeito de tipografia cinetica na hero/header da pagina de inicio, onde as palavras aparecem, se movimentam e responsem de forma fluida e organica, criando um impacto visual memoravel na chegada do usuario.

## Problema / Oportunidade
- O header da pagina `inicio` e funcional, mas nao transmite o sentimento de comunidade, empoderamento e exclusividade que a marca Crown quer transmitir.
- A primeira impressao (hero section) e decisiva para engajamento e retencao de usuarios.
- Tipografia cinetica (kinetic typography) e um diferencial visual forte e "fora da caixa" que poucos apps usam.
- Conecta perfeitamente com o conceito de "Reino" e a identidade da Crown.

## Descricao Tecnica
- Criar um componente `KineticHero` no topo da pagina `/inicio`:
  - Texto "Bem-vinda ao seu" aparece primeiro (fade in).
  - Depois, palavras "Reino", "Imperio", "Destino" se alternam via animacao de flipping/sliding substituíveis.
  - Frase final: "Ganhe coroas e suba no ranking." aparece com animacao de letra por letra.
- Tecnica:
  - Usar `framer-motion` com `AnimatePresence` e `motion.span` para cada letra.
  - Ou usar a lib `framer-motion` com `useInView` para ativar a animacao apenas quando a secao estiver visivel.
  - Cada letra e um `motion.span` com delay crescente (stagger effect):
    ```tsx
    const letters = "Ganhe coroas".split("");
    {letters.map((char, i) => (
      <motion.span
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05, duration: 0.4 }}
        className="inline-block"
      >
        {char === " " ? "\u00A0" : char}
      </motion.span>
    ))}
    ```
- Efeito de "palavra alternada" (word carousel):
  - Uma lista de palavras ["Reino", "Imperio", "Destino", "Lugar"] que roda via `AnimatePresence` com exitBeforeEnter.
- Para o termo mais importante — "Tributos e coroas" — aplicar cor dourada e um `text-shadow` sutil: `text-shadow: 0 0 20px rgba(255, 215, 0, 0.4);`
- **Responsive**: Em mobile (< 430px) limitar o numero de letras e aumentar o font-size da palavra chave para que quebre corretamente.
- **Accessibility**: `prefers-reduced-motion` deve mostrar o texto estatico completo imediatamente, sem animacao.
- **Performance**: Usar `will-change: transform, opacity` nas letras, e evitar re-renderizar quando fora da viewport (via `useInView`).

## Referencias
- https://www.framer.com/motion/
- https://heroic.ai/ (exemplo de kinetic hero)

## Prioridade: Media
