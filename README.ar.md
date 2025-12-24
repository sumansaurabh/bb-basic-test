# موقع Next.js الأساسي

تطبيق Next.js بسيط مع TypeScript و Tailwind CSS.

## البداية

### التطوير
تشغيل خادم التطوير:
```bash
pnpm dev
```
افتح [http://localhost:3000](http://localhost:3000) لعرض الموقع.

### البناء
إنشاء نسخة الإنتاج:
```bash
pnpm build
```

### الإنتاج
بدء خادم الإنتاج:
```bash
pnpm start
```

### الفحص
تشغيل ESLint:
```bash
pnpm lint
```

## هيكل المشروع
- `src/app/page.tsx` - مكون الصفحة الرئيسية
- `src/app/layout.tsx` - مكون التخطيط الجذري
- `src/app/globals.css` - الأنماط العامة
- `public/` - الأصول الثابتة
