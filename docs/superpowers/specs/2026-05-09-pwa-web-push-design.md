# PWA e Web Push Design

Data: 2026-05-09

## Objetivo

Transformar a plataforma CROWN em um PWA instalavel no celular e adicionar notificacoes push nativas para eventos essenciais da comunidade. A primeira versao deve priorizar instalacao confiavel, permissao clara para notificacoes, envio individual por dispositivo e comunicados globais controlados pelo ADM.

## Escopo

- App instalavel como PWA em Android, iOS e desktop compatíveis.
- Manifest, icones, cores de tema, modo standalone e fallback offline simples.
- Service worker para instalacao, cache basico de assets e recebimento de push.
- Assinatura Web Push por usuario e dispositivo.
- Envio de push para notificacoes essenciais existentes.
- Nova area admin para comunicados globais.
- Registro in-app e push para comunicados globais enviados a todas as membras ativas.

## Fora do Escopo Inicial

- Criacao de posts, check-ins ou missoes offline com sincronizacao posterior.
- Cache offline de listas/dados dinamicos para leitura completa sem internet.
- Segmentacao avancada por canais, interesses, tags ou cohortes.
- Analytics avancados de campanha.
- Uso de servicos externos como OneSignal ou Firebase Cloud Messaging.

## Arquitetura

O PWA sera implementado dentro do app Next.js existente. Os arquivos publicos do PWA ficarao em `public/`, enquanto a integracao de permissao/assinatura ficara em componentes client-side carregados dentro da area autenticada.

O backend usara Web Push nativo com VAPID. Cada navegador/dispositivo gera uma assinatura push propria, que sera salva no banco ligada ao `User`. Quando uma notificacao in-app for criada por um evento essencial, o servidor tambem tentara enviar push para as assinaturas ativas daquele usuario.

Para comunicados globais, uma rota admin recebera titulo, mensagem e link opcional. O servidor buscara usuarios com `subscriptionStatus = ACTIVE`, criara notificacoes in-app para eles e disparara push para as assinaturas cadastradas.

As rotas e servicos que enviam push devem rodar no runtime Node.js do Next.js, nao no Edge runtime, porque bibliotecas Web Push dependem de APIs de rede/crypto do Node.

## Componentes

### PWA Base

- `public/manifest.webmanifest`: nome, short name, start URL, display standalone, theme/background color e icones.
- `public/sw.js`: service worker com install/activate/fetch/push/notificationclick.
- `src/app/offline/page.tsx`: fallback amigavel quando o app estiver sem internet.
- `src/app/layout.tsx`: metadata do manifest, theme color e hints PWA.
- Icones gerados a partir dos assets existentes da marca, preferencialmente `public/logo.png`.
- Metadados especificos para iOS, incluindo `apple-touch-icon`, status bar style e tamanhos de icone compativeis com Add to Home Screen.

### Assinaturas Push

Adicionar modelo Prisma para armazenar assinaturas por dispositivo:

- `id`
- `userId`
- `endpoint` unico
- `p256dh`
- `auth`
- `userAgent` opcional
- `expirationTime` opcional
- `createdAt`
- `updatedAt`
- `lastSeenAt`

O endpoint unico evita duplicar o mesmo dispositivo. Um usuario pode ter varias assinaturas porque pode usar mais de um telefone/navegador.

Se o mesmo endpoint reaparecer autenticado por outro usuario, o sistema deve tratar como troca de conta no mesmo navegador: a assinatura pode passar para o usuario autenticado atual somente durante um novo fluxo explicito de `POST` subscribe e apenas quando as chaves enviadas (`p256dh` e `auth`) forem iguais as da assinatura existente. Chaves diferentes devem ser rejeitadas para evitar confusao de propriedade do endpoint. Remocoes e atualizacoes fora desse fluxo devem validar propriedade do endpoint.

O modelo `Notification` existente tambem deve receber um campo opcional `linkUrl` para que notificacoes in-app e push possam levar a membra para a tela correta ao clicar. Para dados existentes, o campo fica nulo e o fallback de abertura sera `/inicio`.

### APIs

- `GET /api/push/vapid-public-key`: retorna a chave publica VAPID para o client.
- `POST /api/push/subscriptions`: salva ou atualiza a assinatura do dispositivo autenticado.
- `DELETE /api/push/subscriptions`: remove a assinatura do dispositivo autenticado.
- `POST /api/admin/notifications`: cria comunicado global para todas as membras ativas e dispara push.

Todas as rotas de assinatura exigem usuario autenticado. A rota admin exige role `ADMIN`.

Links recebidos por APIs devem ser validados. Para a primeira versao, aceitar apenas URLs internas que comecem com `/` ou URLs absolutas da origem configurada do app. Rejeitar `javascript:`, URLs malformadas e destinos fora da allowlist. O service worker tambem deve validar a URL antes de abrir uma janela em `notificationclick`, usando `/inicio` como fallback.

### Client de Permissao

Um componente client-side deve registrar o service worker e oferecer ativacao de notificacoes sem pedir permissao automaticamente. O pedido de permissao deve acontecer apos uma acao explicita da membra, evitando bloqueios do navegador e uma experiencia invasiva.

O estado exibido deve cobrir:

- Navegador sem suporte a service worker/push.
- Notificacoes bloqueadas pelo sistema/navegador.
- Permissao pendente.
- Notificacoes ativas neste dispositivo.
- Erro de registro ou envio da assinatura.

Tambem deve existir uma acao para desativar notificacoes neste dispositivo. O service worker deve tratar `pushsubscriptionchange` quando suportado, tentando renovar a assinatura ou orientando o app a refazer o subscribe na proxima abertura.

### Envio Push

Criar um servico de dominio para enviar push para usuarios. Esse servico:

- Busca assinaturas do usuario ou de um conjunto de usuarios.
- Envia payload com `title`, `body`, `url` opcional e `notificationId` opcional.
- Remove assinaturas invalidas quando o envio retornar status permanente, como 404/410.
- Nao bloqueia a criacao da notificacao in-app se o push falhar.

Envios para muitos usuarios devem ser processados em lotes com limite de concorrencia para reduzir timeout e carga no servidor. A primeira versao pode executar o lote dentro da request admin se o volume for pequeno, mas o design deve manter a funcao de fan-out isolada para migrar depois para job/worker sem mudar as chamadas de dominio.

## Eventos de Notificacao

A primeira versao enviara push para:

- Comentario em post da membra.
- Resposta a comentario da membra.
- Aprovacao/reprovacao de check-in ou missao.
- Novo evento criado pelo admin.
- Comunicado global enviado pelo ADM.

Curtidas ficam apenas como notificacao in-app nesta primeira versao para evitar excesso de ruido no telefone.

## Painel Admin

Adicionar item `Notificacoes` ao menu admin. A tela tera:

- Campo de titulo.
- Campo de mensagem.
- Campo opcional de link interno/externo.
- Botao de envio.
- Feedback de sucesso com quantidade de usuarios/notificacoes processadas.

Cada comunicado global deve ter um registro de auditoria/idempotencia para evitar reenvio acidental no refresh ou retry da request. Esse registro deve guardar autor, titulo, mensagem, link, status, quantidade alvo, quantidade entregue para in-app, quantidade de pushes tentados e falhas.

A idempotencia deve usar uma chave unica recebida do client em header ou body. Se a mesma chave for enviada novamente pelo mesmo ADM, a API deve retornar o registro existente sem reenviar notificacoes.

O envio sera para todas as membras ativas. Segmentacao por role, canal ou interesse fica para uma fase futura.

## Fluxo de Dados

1. Membra entra no app autenticada.
2. Componente PWA registra `public/sw.js`.
3. Membra clica para ativar notificacoes.
4. Navegador solicita permissao.
5. Se permitido, navegador cria `PushSubscription` usando a chave publica VAPID.
6. Client envia assinatura para `POST /api/push/subscriptions`.
7. Backend salva ou atualiza a assinatura ligada ao usuario.
8. Um evento essencial cria notificacao in-app.
9. Servico de push envia payload para as assinaturas do usuario.
10. Service worker mostra a notificacao no telefone.
11. Ao clicar, a notificacao abre o app na URL definida ou em `/inicio`.

## Tratamento de Erros

- Falha de push nao deve impedir a criacao da notificacao in-app.
- Assinaturas expiradas ou invalidas devem ser removidas automaticamente.
- Ausencia de variaveis VAPID deve desabilitar envio push com erro claro em log, sem quebrar o app.
- Navegadores sem suporte devem mostrar estado informativo, sem tentar assinar.
- Em iOS, a UI deve explicar que push funciona apenas com o PWA instalado na Tela de Inicio.

## Variaveis de Ambiente

Adicionar:

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

`VAPID_SUBJECT` pode ser um `mailto:` da operacao, por exemplo `mailto:admin@...`, ou a URL oficial do app.

## Segurança e Privacidade

- Cada assinatura pertence a um usuario autenticado.
- A rota admin de comunicado global exige `ADMIN`.
- Criacao, atualizacao e remocao de assinatura devem validar propriedade do usuario autenticado, exceto no fluxo explicito de novo `POST` subscribe que pode transferir o endpoint para a conta atual do mesmo navegador somente quando as chaves enviadas (`p256dh` e `auth`) coincidirem com a assinatura existente; chaves diferentes devem ser rejeitadas.
- Links de notificacao devem ser internos ou pertencer a uma allowlist definida.
- Payloads push devem conter apenas texto necessario e URL, evitando dados sensiveis.
- Remocao de assinatura deve validar que o endpoint pertence ao usuario autenticado.

## Testes e Verificacao

- Testes unitarios para o servico de push cobrindo envio, erro permanente e remocao de assinatura invalida.
- Testes unitarios para repositorio/servico de notificacao global quando possivel.
- Testes para autorizacao das APIs de assinatura e admin.
- Testes para propriedade do endpoint ao remover/atualizar assinatura.
- Testes para rejeicao de URL invalida ou fora da allowlist.
- Testes para comportamento quando VAPID nao esta configurado.
- Testes para garantir que falha de push nao bloqueia criacao da notificacao in-app.
- `npm test` para suite existente.
- `npm run lint` para validacao de codigo.
- `npm run build` para validar Next.js, Prisma e assets PWA.
- Verificacao manual em navegador HTTPS/local compatível: instalar app, ativar notificacoes, desativar notificacoes, enviar comunicado admin e clicar na notificacao.
- Verificacao manual em iOS compativel: Add to Home Screen, abertura em standalone e permissao push apos instalado.

## Limitações Conhecidas

- Push em iPhone exige iOS compatível, app instalado na Tela de Inicio e permissao concedida.
- Push exige HTTPS em producao.
- O service worker nao deve tentar cachear respostas autenticadas dinamicas nesta fase para evitar dados antigos ou vazamento entre sessoes.
- Entrega push nao e garantida por todos os sistemas operacionais; o registro in-app continua sendo a fonte confiavel.
