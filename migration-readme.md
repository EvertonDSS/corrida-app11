# 🔄 Migrações com TypeORM

## 📋 Sobre Migrações

As migrações permitem versionar e gerenciar mudanças no schema do banco de dados de forma controlada.

## 🚀 Como Usar

### 1. Gerar uma Migração

```bash
# Usando SQLite
npm run typeorm migration:generate -- -n NomeDaMigracao

# Usando PostgreSQL
DB_TYPE=postgres npm run typeorm migration:generate -- -n NomeDaMigracao
```

### 2. Executar Migrações

```bash
# Executar migrações pendentes
npm run typeorm migration:run

# Reverter última migração
npm run typeorm migration:revert
```

### 3. Criar Tabelas Manualmente

Se preferir criar as tabelas manualmente, você pode usar o `synchronize: true` no `database.config.ts` (apenas para desenvolvimento).

## ⚙️ Configuração

As configurações do banco estão em `src/config/database.config.ts`.

### Para Usar PostgreSQL:
```typescript
USE_POSTGRES: true
```

### Para Usar SQLite:
```typescript
USE_POSTGRES: false
```

## 📝 Notas

- `synchronize: true` deve ser usado APENAS em desenvolvimento
- Em produção, use migrações
- Sempre faça backup antes de executar migrações
- Teste as migrações em ambiente de desenvolvimento primeiro
