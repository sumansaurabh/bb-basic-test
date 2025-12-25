# መሰረታዊ Next.js ድረ-ገጽ

TypeScript እና Tailwind CSS የሚጠቀም ቀላል Next.js መተግበሪያ።

## መጀመር

### ልማት
የልማት አገልጋይን ያስጀምሩ：
```bash
pnpm dev
```
ድረ-ገጹን ለማየት [http://localhost:3000](http://localhost:3000) ይክፈቱ።

### ግንባታ
የምርት ግንባታ ይፍጠሩ：
```bash
pnpm build
```

### ምርት
የምርት አገልጋይን ያስጀምሩ：
```bash
pnpm start
```

### ኮድ ማረጋገጫ
ESLint ያስጀምሩ：
```bash
pnpm lint
```

## የፕሮጀክት መዋቅር
- `src/app/page.tsx` - ዋና ገጽ አካል
- `src/app/layout.tsx` - ዋና አቀማመጥ አካል
- `src/app/globals.css` - አጠቃላይ ቅጦች
- `public/` - የማይለዋወጡ ንብረቶች
