# 🗄️ Configuração de Banco de Dados

## 📖 Como Alternar Entre PostgreSQL e SQLite

### Configuração

Todas as configurações estão em `src/config/database.config.ts`

### Alternar para PostgreSQL

```typescript
// src/config/database.config.ts
export const DB_CONFIG = {
  USE_POSTGRES: true,  // ← Altere para true
  // ... resto da config
};
```

### Alternar para SQLite

```typescript
// src/config/database.config.ts
export const DB_CONFIG = {
  USE_POSTGRES: false,  // ← Altere para false
  // ... resto da config
};
```

## 🚀 Como Usar

1. **Altere o valor de `USE_POSTGRES`** em `src/config/database.config.ts`
2. **Reinicie o aplicativo**: `npm run start:dev`
3. **O sistema automaticamente usará o banco configurado**

## 📝 Credenciais PostgreSQL Atuais

```typescript
host: "square-cloud-db-5f7fc35aec824eaf8faa4b4518907b79.squareweb.app"
port: 7068
username: "squarecloud"
password: "YlpqpZbevxvDgO439aLuNSte"
database: "corrida-test-2"
ssl: {
  rejectUnauthorized: false,
  ca: // Lê certs/client.crt
  cert: // Lê certs/client.crt
  key: // Lê certs/client.key
}
```

### 🔐 Certificados SSL

Os certificados estão na pasta `certs/`:
- `client.crt` - Certificado do cliente
- `client.key` - Chave privada do cliente
- `client.pem` - Certificado completo

O sistema automaticamente usa esses certificados para conexão SSL segura.

## ⚠️ Importante

- **SQLite**: Banco local, não precisa de servidor
- **PostgreSQL**: Banco remoto na Square Cloud
- **`synchronize: true`**: Ativa sincronização automática (apenas desenvolvimento)
- **Desenvolvimento**: Use SQLite para maior velocidade
- **Produção**: Use PostgreSQL para persistência na nuvem

## 🔄 Migrações

Ver `migration-readme.md` para detalhes sobre migrações.
