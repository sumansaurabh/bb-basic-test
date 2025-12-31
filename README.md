# Basic Next.js Website

A simple Next.js application with TypeScript and Tailwind CSS.

## Getting Started

### Development
Run the development server:
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the website.

### Build
Create a production build:
```bash
pnpm build
```

### Production
Start the production server:
```bash
pnpm start
```

### Linting
Run ESLint:
```bash
pnpm lint
```

## Project Structure
- `src/app/page.tsx` - Main page component
- `src/app/layout.tsx` - Root layout component
- `src/app/globals.css` - Global styles
- `public/` - Static assets

## Stripe Payments
- Set `STRIPE_SECRET_KEY` in the server environment for API calls.
- Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in the client environment.
- Optionally define `NEXT_PUBLIC_SITE_URL` to control redirect URLs.
- Trigger checkout from the new "Upgrade" button on the main page.
