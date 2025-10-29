# 🔄 Endpoint: Renomear Apostador

## 📋 Descrição

Endpoint para renomear apostadores e atualizar todas as suas apostas em um campeonato específico.

## 🚀 Endpoint

```
POST /apostadores/renomear/{campeonatoId}
```

## 📥 Parâmetros

### **URL Parameters:**
- **`campeonatoId`** (integer): ID do campeonato

### **Body (JSON):**
```json
{
  "nomeOriginal": "João Silva",
  "novoNome": "João Santos Silva"
}
```

## 📤 Resposta

### **Sucesso (200):**
```json
{
  "apostador": {
    "id": 1,
    "nome": "João Santos Silva",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T15:30:00.000Z"
  },
  "apostasAtualizadas": 5,
  "campeonatoId": 1,
  "nomeOriginal": "João Silva",
  "novoNome": "João Santos Silva"
}
```

### **Erros:**

#### **404 - Apostador não encontrado:**
```json
{
  "statusCode": 404,
  "message": "Apostador com nome \"João Silva\" não encontrado",
  "error": "Not Found"
}
```

#### **404 - Sem apostas no campeonato:**
```json
{
  "statusCode": 404,
  "message": "Apostador \"João Silva\" não possui apostas no campeonato 1",
  "error": "Not Found"
}
```

#### **409 - Nome já existe:**
```json
{
  "statusCode": 409,
  "message": "Já existe um apostador com o nome \"João Santos Silva\"",
  "error": "Conflict"
}
```

## 🔧 Funcionalidades

### **✅ Validações:**
- **Case Insensitive**: "João Silva" = "joão silva" = "JOÃO SILVA"
- **Verificação de Conflito**: Impede nomes duplicados
- **Validação de Existência**: Verifica se o apostador existe
- **Validação de Campeonato**: Confirma apostas no campeonato

### **🔄 Processo:**
1. **Normaliza** os nomes (trim)
2. **Verifica** se o novo nome já existe
3. **Busca** o apostador pelo nome original (case insensitive)
4. **Confirma** apostas no campeonato especificado
5. **Atualiza** o nome do apostador
6. **Retorna** informações da atualização

## 📊 Exemplo de Uso

### **Request:**
```bash
curl -X POST "http://localhost:3002/apostadores/renomear/1" \
  -H "Content-Type: application/json" \
  -d '{
    "nomeOriginal": "João Silva",
    "novoNome": "João Santos Silva"
  }'
```

### **Response:**
```json
{
  "apostador": {
    "id": 1,
    "nome": "João Santos Silva",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T15:30:00.000Z"
  },
  "apostasAtualizadas": 5,
  "campeonatoId": 1,
  "nomeOriginal": "João Silva",
  "novoNome": "João Santos Silva"
}
```

## 🎯 Casos de Uso

### **1. Correção de Nome:**
- **Original**: "João Silva"
- **Novo**: "João Santos Silva"
- **Resultado**: Todas as apostas atualizadas

### **2. Padronização:**
- **Original**: "joão silva"
- **Novo**: "João Silva"
- **Resultado**: Capitalização corrigida

### **3. Mudança de Sobrenome:**
- **Original**: "Maria Silva"
- **Novo**: "Maria Santos"
- **Resultado**: Nome atualizado em todas as apostas

## ⚠️ Observações

- ✅ **Case Insensitive**: Busca funciona independente da capitalização
- ✅ **Preservação**: Mantém histórico de apostas
- ✅ **Validação**: Impede conflitos e erros
- ✅ **Transparência**: Retorna informações detalhadas
- ✅ **Segurança**: Valida existência antes de atualizar

## 🔗 Relacionamentos

- **Apostador** → **Aposta**: Todas as apostas são automaticamente atualizadas
- **Campeonato** → **Aposta**: Validação por campeonato específico
- **Histórico**: Preserva datas de criação e atualização

## 📝 Resumo

Este endpoint permite:
- ✅ **Renomear** apostadores de forma segura
- ✅ **Validar** conflitos e existência
- ✅ **Atualizar** todas as apostas relacionadas
- ✅ **Manter** integridade dos dados
- ✅ **Retornar** informações detalhadas

Ideal para correções de nomes e padronização de dados!
