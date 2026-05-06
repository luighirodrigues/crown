# 03 — Liquid Glass / Frosted Glass UI

## Resumo
Remodelar os componentes glassmorphic existentes (como bottom-nav, sidebar, header) para um padrao "Liquid Glass" mais moderno e premium, com blur dinamico, bordas suaves e reflexos de luz.

## Problema / Oportunidade
- A interface ja usa algum glassmorphism no bottom-nav e header, mas ele e basico (`bg-white/80 backdrop-blur`).
- O Liquid Glass e uma evolucao que simula vidro real com curvas, reflejo, e profundidade — associado a produtos Apple e a aplicativos premium.
- A cor dourada do tema Crown se beneficia MUITO de ser colocada "dentro" do vidro, com luz passando por tras.

## Descricao Tecnica
- Trocar classes simples de glassmorphism por um padrao mais elaborado:
  ```css
  .liquid-glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 
      inset 0 1px 1px rgba(255, 255, 255, 0.2),
      0 8px 32px rgba(0, 0, 0, 0.1);
    border-radius: 24px;
  }
  ```
- Aplicar em: BottomNav (mobile), DesktopHeader, SidebarCard, e modals.
- Adicionar uma Subtle highlight (gradient de cima para baixo com 4% opacity) para simular reflexo de luz em vidro.
- Ajustar o global.css para definir `--glass-bg`, `--glass-border`, `--glass-shadow` como variaveis de CSS.
- Testar no Safari (webkit suporta backdrop-filter melhor) e garantir fallbacks para Chrome/Firefox.

## Referencias
- https://www.apple.com/ios/ios-18/
- https://ui.glass/generator/

## Prioridade: Alta
