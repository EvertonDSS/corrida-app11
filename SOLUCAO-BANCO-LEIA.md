# 🗄️ Solução: Erro "database does not exist"

## ❌ Problema

Erro ao conectar ao PostgreSQL:
```
error: database "corrida-test-2" does not exist
```

## ✅ Solução Implementada

O sistema agora **cria automaticamente o banco de dados** se ele não existir ao iniciar a aplicação.

### Como Funciona

1. **Verifica se o banco existe** antes de conectar
2. **Cria o banco** se não existir
3. **Conecta normalmente** após garantir que existe

### Código Implementado

**`src/config/database.config.ts`:**
- Função `ensureDatabaseExists()` que verifica e cria o banco

**`src/main.ts`:**
- Chama `ensureDatabaseExists()` antes de criar o AppModule

## 📝 Se o Problema Persistir

### Opção 1: Verificar Nome do Banco

Verifique qual é o nome correto do banco na Square Cloud e atualize em:

```typescript
// src/config/database.config.ts
database: 'NOME_CORRETO_DO_BANCO',
```

### Opção 2: Usar SQLite Temporariamente

Se quiser testar sem PostgreSQL:

```typescript
// src/config/database.config.ts
USE_POSTGRES: false, // ← Mude para false
```

### Opção 3: Criar Banco Manualmente

Conecte via ferramenta PostgreSQL (pgAdmin, psql, etc.) e crie:

```sql
CREATE DATABASE "corrida-test-2";
```

## 🚀 Próximos Passos

Após o banco ser criado, o sistema vai:

1. ✅ Sincronizar as entidades
2. ✅ Criar todas as tabelas
3. ✅ Estar pronto para uso

## 📊 Logs Esperados

Ao iniciar a aplicação, você verá:

```
✅ Conectado ao servidor PostgreSQL
📝 Criando banco de dados: corrida-test-2
✅ Banco de dados criado com sucesso!
🗄️ Usando PostgreSQL
[Nest] LOG [NestFactory] Starting Nest application...
```
