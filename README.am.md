# መሰረታዊ Next.js ድረ-ገጽ

TypeScript እና Tailwind CSS ጋር ቀላል Next.js መተግበሪያ።

## መጀመሪያ

### ልማት
የልማት አገልግሎት አስጀምር：
```bash
pnpm dev
```
ድረ-ገጹን ለማየት [http://localhost:3000](http://localhost:3000) ክፈት።

### ግንባታ
የምርት ግንባታ ፍጠር：
```bash
pnpm build
```

### ምርት
የምርት አገልግሎት አስጀምር：
```bash
pnpm start
```

### ኮድ ፍተሻ
ESLint አሂድ：
```bash
pnpm lint
```

## የፕሮጀክት መዋቅር
- `src/app/page.tsx` - ዋና ገጽ አካል
- `src/app/layout.tsx` - ስር አቀማመጥ አካል
- `src/app/globals.css` - አለም አቀፍ ቅጦች
- `public/` - የማይለዋወጡ ንብረቶች
