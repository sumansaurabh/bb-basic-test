# बेसिक Next.js वेबसाइट

TypeScript और Tailwind CSS के साथ एक सरल Next.js एप्लिकेशन।

## शुरू करना

### विकास
विकास सर्वर चलाएँ:
```bash
pnpm dev
```
वेबसाइट देखने के लिए [http://localhost:3000](http://localhost:3000) खोलें।

### निर्माण
एक उत्पादन निर्माण बनाएँ:
```bash
pnpm build
```

### उत्पादन
उत्पादन सर्वर शुरू करें:
```bash
pnpm start
```

### लिंटिंग
ESLint चलाएँ:
```bash
pnpm lint
```

## परियोजना संरचना
- `src/app/page.tsx` - मुख्य पृष्ठ घटक
- `src/app/layout.tsx` - रूट लेआउट घटक
- `src/app/globals.css` - वैश्विक शैलियाँ
- `public/` - स्थिर संपत्तियाँ