# 🚀 Deploy no Render

## 📋 Configuração Necessária

### 1. Variáveis de Ambiente no Render

No painel do Render, adicione estas variáveis de ambiente:

```
NODE_ENV=production
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
DISPLAY=:99
```

### 2. Build Command

```
npm install && npm run build
```

### 3. Start Command

```
npm run start:prod
```

## 🐛 Solução de Problemas do Puppeteer

### Problema: "Could not find Chrome"

**Solução**: O script `postinstall` agora instala o Chrome automaticamente após `npm install`.

### Configuração Alternativa

Se ainda não funcionar, crie um arquivo `.nvmrc` com:

```
20.0.0
```

## 🔧 Scripts Adicionados

### `postinstall`
Instala o Chrome automaticamente após as dependências:

```json
"postinstall": "node node_modules/puppeteer/install.js"
```

## 📝 Configuração do Puppeteer

O código foi atualizado para:

1. **Usar headless mode**: `headless: 'new'`
2. **Múltiplos args de otimização**: Para ambientes de produção
3. **executablePath via env**: `process.env.PUPPETEER_EXECUTABLE_PATH`

## 🚀 Deploy

1. Conecte seu repositório GitHub ao Render
2. Configure as variáveis de ambiente acima
3. Deploy automático!

## 📊 Logs Esperados

Após o deploy, você deve ver:

```
✓ Chrome instalado com sucesso
✓ Build concluído
✓ Servidor iniciado na porta 10000
```

## ⚠️ Importante

- O install do Chrome pode demorar alguns minutos
- Certifique-se de ter pelo menos 1GB de memória no plano Render
- Se houver timeout, aumente o tempo limite de build
