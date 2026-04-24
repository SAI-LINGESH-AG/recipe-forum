# Recipe Forum

A simple web app where people can share recipes, view recipe details, and manage their own posts. Think of it like a lightweight community cookbook-create an account, publish a recipe, and edit it later if you need to.

## What you can do

- **Sign up / log in** to your account
- **Create recipes** with ingredients, steps, prep/cook time, servings, cuisine type, and difficulty
- **Edit your own recipes** (others can’t edit your posts)
- **Optional video link support** (YouTube/Vimeo/Drive/direct links are handled safely)
- **Forgot password / reset password** flow via email

## Tech overview (plain English)

- **Frontend + backend**: built with [Next.js](https://nextjs.org/) (React)
- **Auth & data**: powered by [Supabase](https://supabase.com/) (login, sessions, database)
- **Deployment**: works well on platforms like Vercel

## Run it locally

Install dependencies and start the app:

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
npm run start
```

## Environment variables

This project expects these environment variables to be set (locally and/or in your hosting provider):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (recommended for production, used for auth redirect URLs)

## Contact

- **Sai Lingesh**: [LinkedIn](https://www.linkedin.com/in/sai-lingesh)
