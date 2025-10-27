# 🔐 Configuração de Certificados SSL

## ✅ Certificados Configurados

O sistema agora utiliza os certificados SSL da pasta `certs/` para estabelecer conexão segura com o banco PostgreSQL.

## 📁 Arquivos de Certificado

Na pasta `certs/` você encontrará:

- **`client.crt`** - Certificado do cliente (1.148 bytes)
- **`client.key`** - Chave privada do cliente (1.730 bytes)  
- **`client.pem`** - Certificado completo (2.882 bytes)

## 🔧 Como Funciona

### Configuração Automática

O arquivo `src/config/database.config.ts` lê automaticamente os certificados:

```typescript
ssl: {
  rejectUnauthorized: false,
  ca: fs.readFileSync(path.join(__dirname, '../../certs/client.crt')).toString(),
  cert: fs.readFileSync(path.join(__dirname, '../../certs/client.crt')).toString(),
  key: fs.readFileSync(path.join(__dirname, '../../certs/client.key')).toString(),
}
```

### Conexão Segura

Quando `USE_POSTGRES: true`:
1. Lê os certificados da pasta `certs/`
2. Configura SSL com os certificados
3. Conecta com segurança ao PostgreSQL da Square Cloud

## ⚠️ Importante

- Não compartilhe os certificados (`client.key`) publicamente
- Os certificados são específicos do banco Square Cloud
- Mantenha a pasta `certs/` fora do controle de versão se necessário
- Use SSL em produção para proteção de dados

## 🔄 Alternar para SQLite

Se quiser usar SQLite (sem SSL):

```typescript
export const DB_CONFIG = {
  USE_POSTGRES: false, // ← Altere para false
  // ...
};
```

## 📝 Notas

- Os certificados são carregados em tempo de execução
- Em produção, considere usar variáveis de ambiente para paths
- A pasta `certs/` deve estar no mesmo nível de `src/`
