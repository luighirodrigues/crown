# 05 — Ambient Orb Glow no Bottom Nav

## Resumo
Substituir o indicador de aba ativa do bottom-nav por uma orb de luz ambiente (glow orb) que se movimenta fluidamente entre os icones usando abas selecionadas, criando uma navegacao mais organica e estetica.

## Problema / Oportunidade
- O bottom-nav atual usa apenas cor de destaque para a aba ativa. E funcional, mas generico.
- A reviu Abr/Suse/Google Material UIs e Hyper Tome trabalham com "moving active state" (estado ativo que se move).
- Um glow orb na cor dourada reforca o branding da Crown e o sentimento de premium.

## Descricao Tecnica
- Criar um componente `AmbientOrbNav` que substitui o `BottomNavigation` existente na parte inferior mobile.
- O componente renderiza um background absoluto da cor `amber-400` com `blur-xl` and `opacity-50` (efeito nebulosa).
- Usar `framer-motion` e seu `layoutId` para mover uma div de `orb` entre as abas ativas via:
  ```jsx
  {activeTab === tab.id && (
    <motion.div
      layoutId="active-orb"
      className="absolute inset-0 bg-amber-400/30 blur-xl rounded-full"
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    />
  )}
  ```
- O glow deve se adpatar ao tamanho do botao clicado, com `layoutId="active-orb"` automaticamente.
- A sombra da orb deve se propagar para os botoes adjacentes levemente com um gradiente radial.
- Ao trocar de aba, a orb deve animar com um ease suave, nao um snap instantaneo.

## Referencias
- https://ui.shadcn.com/docs/components/tabs (tem um exemplo similar)
- https://motion.dev/

## Prioridade: Baixa
