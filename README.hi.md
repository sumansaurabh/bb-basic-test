# बेसिक Next.js वेबसाइट

TypeScript और Tailwind CSS के साथ एक सरल Next.js एप्लिकेशन।

## शुरुआत करें

### विकास (Development)
विकास सर्वर चलाएं:
```bash
pnpm dev
```
वेबसाइट देखने के लिए [http://localhost:3000](http://localhost:3000) खोलें।

### बिल्ड (Build)
प्रोडक्शन बिल्ड बनाएं:
```bash
pnpm build
```

### प्रोडक्शन (Production)
प्रोडक्शन सर्वर शुरू करें:
```bash
pnpm start
```

### लिंटिंग (Linting)
ESLint चलाएं:
```bash
pnpm lint
```

## प्रोजेक्ट संरचना
- `src/app/page.tsx` - मुख्य पेज कंपोनेंट
- `src/app/layout.tsx` - रूट लेआउट कंपोनेंट
- `src/app/globals.css` - ग्लोबल स्टाइल्स
- `public/` - स्टैटिक एसेट्स
