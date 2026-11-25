This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## PWA e notificações push

Em homologação e produção, sirva a Crown via HTTPS e configure `AUTH_URL` com a origem pública. Gere um par VAPID com `npx web-push generate-vapid-keys` e configure `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT` no servidor. Use um contato da operação, como `mailto:admin@example.com`, para o assunto. Preserve o par de chaves entre deploys, pois cada assinatura do navegador está associada à chave usada na ativação.

Aplique `npx prisma migrate deploy` no banco do ambiente antes de iniciar a nova versão. Com uma conta de teste, instale a Crown e confirme que abre em modo de app. No iPhone, adicione à Tela de Início pelo menu Compartilhar. Abra o app instalado e toque em **Ativar**. Em seguida, envie um comunicado com um link interno por **Admin → Notificações** e confira o recebimento no dispositivo, o destino ao tocar e o registro no painel da Crown. Por fim, desative no dispositivo e confirme que ele deixa de receber push.
