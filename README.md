This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
cp .env.example .env
```
*Penting:* Anda harus memiliki konfigurasi `DATABASE_URL` yang valid. Selain itu, Anda harus mengkonfigurasi `BETTER_AUTH_SECRET` (dan `BETTER_AUTH_URL` untuk environment non-development) untuk sesi otentikasi. Jika akan menjalankan unit/integration test, atur juga `TEST_DATABASE_URL` secara terpisah di environment untuk pengamanan (DB Guard).

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

- Node.js >= 20.x
- PostgreSQL >= 15 (untuk database utama dan test suite)
- npm >= 10.x
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- **Security & DB Guard:** Menggunakan `TEST_DATABASE_URL` eksplisit untuk integrasi.
- **Authentication:** Bermigrasi penuh menggunakan `better-auth` dengan Drizzle Adapter, yang mengamankan rute serta menyimpan sesi dan rate limits di PostgreSQL.
- **ACID Transactions:** Engine backend (seperti `sync-handler.ts`) menggunakan *strict serializable transaction* untuk memastikan kekonsistenan state pemain.
- **Idempotency & Integrity:** Pemuatan konten melalui `content-loader.ts` memverifikasi SHA-256 manifest untuk memastikan konsistensi antara DB dan disk.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
