# 08 — Magnetic Buttons com Elasticidade

## Resumo
Implementar botoes e elementos interativos que "atraem" o cursor do mouse magneticamente, com um efeito de elasticidade suave ao chegar proximo. Isso cria uma sensacao de fisica e interatividade premium na interface.

## Problema / Oportunidade
- Botoes estaticos passam despercebidos e nao convidam o usuario a clicar.
- Efeitos magneticos sao populares em websites premium (agencias, portfolios) e aumentam a percepção de qualidade.
- Em interfaces mobile-first, a interacao tambem funciona com toque (o botao pula para o dedo do usuario).
- A plataforma e baseada numa comunidade engajada; interacoes satisfatorias aumentam o tempo de uso.

## Descricao Tecnica
- Criar um componente `MagneticButton` que utiliza Framer Motion:
  - No `onMouseMove` dentro do componente, calcular a posicao do cursor em relacao ao centro do botao.
  - Aplicar `animate={{ x, y }}` com `transition={{ type: "spring", stiffness: 150, damping: 15 }}`.
  - Usar um raio de atencao: so magnetiza dentro de `ref` bounding box + 50px de padding.
- Parabola de forca: a forca magnetica aumenta com a proximidade do cursor, simulando um campo magnetico real.
- Ao sair do raio, o botao "rebola" para a posicao original com `spring`.
- Variacoes:
  - `MagneticButton` para CTA principal
  - `MagneticLink` para links de navegacao
  - `MagneticIcon` para icones de acao (like, compartilhar)
- Implementar com `useMotionValue` e `useSpring` do Framer Motion para performance e suavidade.
- Fallback: quando `prefers-reduced-motion` esta ativo, desativar completamente o efeito.

## Exemplo de codigo
```tsx
const MagneticButton = ({ children }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distX = e.clientX - centerX;
    const distY = e.clientY - centerY;
    
    x.set(distX * 0.3);
    y.set(distY * 0.3);
  };
  
  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ x, y }}
    >
      {children}
    </motion.button>
  );
};
```

## Referencias
- https://lenis.darkroom.engineering/
- https://tympanus.net/codrops/2021/09/15/magnetic-buttons/

## Prioridade: Baixa
