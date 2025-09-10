# 🚨 REGOLE OBBLIGATORIE WORKFLOW IT-ERA

## 1️⃣ PRIMA DI OGNI FUNZIONALITÀ - USA CONTEXT7
```bash
# SEMPRE eseguire prima:
npx @context7/mcp-server analyze --project it-era --feature "[nome-feature]"
```

### Context7 deve analizzare:
- SEO impact della feature
- Content requirements 
- User experience implications
- Performance considerations
- Accessibility requirements

### NON procedere senza approvazione Context7!

## 2️⃣ DOPO OGNI MODIFICA - USA PLAYWRIGHT
```javascript
// SEMPRE testare con Playwright MCP:
const playwright = require('@playwright/mcp');

async function testChanges() {
  const browser = await playwright.launch({ headless: false });
  const page = await browser.newPage();
  
  // Test locale
  await page.goto('http://localhost:3000/[pagina-modificata]');
  
  // Verifica visuale
  await page.screenshot({ path: 'test-results/[modifica].png' });
  
  // Test interazioni
  await page.click('[elemento-nuovo]');
  
  // Test production
  await page.goto('https://it-era.it/[pagina-modificata]');
  
  await browser.close();
}
```

## 3️⃣ WORKFLOW COMPLETO OBBLIGATORIO

### STEP 1: Context7 Analysis
```bash
npx @context7/mcp-server analyze --feature "[feature]" --seo true --ux true
```

### STEP 2: Implementazione
- Codice seguendo le linee guida Context7
- Include sempre GA4 + GTM
- Include sempre menu navigation

### STEP 3: Test Playwright
```bash
npx @playwright/mcp test --url "https://it-era.it/[page]" --visual true --interactive true
```

### STEP 4: Deploy
```bash
npx wrangler pages deploy web --project-name it-era --commit-dirty=true
```

### STEP 5: Verifica Production con Playwright
```bash
npx @playwright/mcp verify --url "https://it-era.it" --full-site true
```

## 📋 CHECKLIST AUTOMATICA

- [ ] Context7 ha analizzato la feature?
- [ ] Context7 ha approvato l'approccio?
- [ ] Codice implementato secondo Context7?
- [ ] Playwright test locale passato?
- [ ] Deploy completato?
- [ ] Playwright test production passato?
- [ ] Salvato in memoria con claude-flow?

## 🧠 MEMORIA AUTOMATICA

Dopo ogni sessione:
```bash
npx claude-flow@alpha memory store "it-era/session/[date]" "[summary of changes]"
npx claude-flow@alpha memory store "it-era/context7/[feature]" "[context7 recommendations]"
npx claude-flow@alpha memory store "it-era/playwright/[test]" "[test results]"
```

---

**QUESTE REGOLE SONO OBBLIGATORIE E NON POSSONO ESSERE IGNORATE!**