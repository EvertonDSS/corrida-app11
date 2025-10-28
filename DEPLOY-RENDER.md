# 🚀 Deploy no Render.com

## ✅ Sim, Vai Funcionar!

A aplicação está configurada para funcionar no Render.com.

## 📋 O Que Foi Configurado

### 1. **Puppeteer para Produção**
- ✅ Múltiplos argumentos de otimização
- ✅ Modo headless configurado
- ✅ Executável configurado via variável de ambiente
- ✅ Postinstall script adicionado

### 2. **Scripts Atualizados**
```json
"postinstall": "node node_modules/puppeteer/install.js"
```

### 3. **Configuração do PdfService**
- ✅ Args otimizados para produção
- ✅ Modo headless habilitado
- ✅ Configuração direta no código

## 🎯 Configuração no Render

### Build Command

```
npm install && npm run build
```

### Start Command

```
npm run start:prod
```

**Nota**: Não são necessárias variáveis de ambiente! Tudo está configurado no código.

## 📊 Como Funciona

1. **Build**: Render executa `npm install` → Chrome é instalado automaticamente
2. **Start**: Aplica inicia com `node dist/main`
3. **PDF**: Puppeteer usa o Chrome instalado para gerar PDFs

## ⚠️ Importante

### Requisitos

- **Mínimo**: 512MB de RAM
- **Recomendado**: 1GB+ de RAM
- **Tempo de Build**: ~5-10 minutos (instalação do Chrome)

### Se Der Erro

1. **Erro de memória**: Upgrade para plano com mais RAM
2. **Timeout**: Aumente o tempo limite de build para 20 minutos
3. **Chrome não encontrado**: Verifique se `postinstall` rodou no build

## 🧪 Teste Local

Para testar antes de fazer deploy:

```bash
npm install
npm run build
npm run start:prod
```

Depois acesse: `http://localhost:3000/api`

## 📝 Logs Esperados

No Render, você verá:

```
✓ Installing dependencies
✓ Installing Chrome (pode demorar...)
✓ Build completed
✓ Starting server on port 10000
```

## 🎉 Deploy

1. Conecte o repositório no Render
2. Configure as variáveis de ambiente
3. Deploy automático!

## 📞 Suporte

Se algo não funcionar, verifique:

1. **Logs do build** no Render
2. **Variáveis de ambiente** configuradas
3. **Plano** tem memória suficiente
