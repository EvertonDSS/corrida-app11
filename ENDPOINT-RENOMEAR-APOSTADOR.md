# 🔄 Endpoint: Renomear Apostador

## 📋 Descrição

Endpoint para renomear apostadores e atualizar todas as suas apostas em um campeonato específico. Se o novo nome já existir, as apostas serão mescladas com o apostador existente.

## 🚀 Endpoint

```
POST /apostadores/renomear/{campeonatoId}
```

## 📥 Parâmetros

### **URL Parameters:**
- **`campeonatoId`** (integer): ID do campeonato

### **Body Parameters:**
```json
{
  "nomeOriginal": "João Silva",
  "novoNome": "João Santos Silva"
}
```

## 📤 Resposta

### **Sucesso - Renomeação (200):**
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
  "novoNome": "João Santos Silva",
  "acao": "renomeado"
}
```

### **Sucesso - Mesclagem (200):**
```json
{
  "apostador": {
    "id": 2,
    "nome": "Maria Santos",
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-15T15:30:00.000Z"
  },
  "apostasAtualizadas": 3,
  "campeonatoId": 1,
  "nomeOriginal": "Maria Silva",
  "novoNome": "Maria Santos",
  "acao": "mesclado",
  "apostadorMesclado": {
    "id": 2,
    "nome": "Maria Santos"
  }
}
```

### **Erro (404):**
```json
{
  "statusCode": 404,
  "message": "Apostador com nome \"João Silva\" não encontrado",
  "error": "Not Found"
}
```

## 🔧 Funcionalidades

### **✅ Características:**
- **Renomeação Simples**: Se o novo nome não existir, apenas renomeia
- **Mesclagem Inteligente**: Se o novo nome existir, mescla as apostas
- **Case Insensitive**: Busca por nome não diferencia maiúsculas/minúsculas
- **Validação**: Verifica se o apostador tem apostas no campeonato
- **Limpeza**: Remove apostador original se não tiver mais apostas

### **🔄 Processo:**
1. **Busca** apostador pelo nome original
2. **Valida** se tem apostas no campeonato
3. **Verifica** se novo nome já existe
4. **Executa** ação (renomear ou mesclar)
5. **Retorna** resultado com tipo de ação

## 📊 Exemplo de Uso

### **Renomeação Simples:**
```bash
curl -X POST "http://localhost:3002/apostadores/renomear/1" \
  -H "Content-Type: application/json" \
  -d '{
    "nomeOriginal": "João Silva",
    "novoNome": "João Santos Silva"
  }'
```

### **Mesclagem com Apostador Existente:**
```bash
curl -X POST "http://localhost:3002/apostadores/renomear/1" \
  -H "Content-Type: application/json" \
  -d '{
    "nomeOriginal": "Maria Silva",
    "novoNome": "Maria Santos"
  }'
```

## 🎯 Casos de Uso

### **1. Correção de Nome:**
- **Objetivo**: Corrigir nome digitado incorretamente
- **Uso**: Interface administrativa
- **Resultado**: Apostador renomeado

### **2. Unificação de Apostadores:**
- **Objetivo**: Mesclar apostadores duplicados
- **Uso**: Limpeza de dados
- **Resultado**: Apostas consolidadas

### **3. Padronização:**
- **Objetivo**: Padronizar nomes de apostadores
- **Uso**: Manutenção de dados
- **Resultado**: Nomes consistentes

## 📋 Estrutura de Dados

### **Resposta:**
- **`apostador`**: Dados do apostador final
- **`apostasAtualizadas`**: Quantidade de apostas movidas
- **`campeonatoId`**: ID do campeonato
- **`nomeOriginal`**: Nome original
- **`novoNome`**: Novo nome
- **`acao`**: Tipo de ação executada ("renomeado" ou "mesclado")
- **`apostadorMesclado`**: Dados do apostador existente (apenas em mesclagem)

### **Tipos de Ação:**
- **`renomeado`**: Nome foi alterado
- **`mesclado`**: Apostas foram mescladas com apostador existente

## ⚠️ Observações

- ✅ **Mesclagem Automática**: Não gera erro se nome já existir
- ✅ **Case Insensitive**: Busca por nome não diferencia maiúsculas/minúsculas
- ✅ **Validação**: Verifica apostas no campeonato específico
- ✅ **Limpeza**: Remove apostador original se não tiver mais apostas
- ✅ **Transação**: Operação atômica (tudo ou nada)

## 🔗 Relacionamentos

- **Apostador** → **Aposta**: Relação através de apostadorId
- **Campeonato** → **Aposta**: Filtro por campeonatoId
- **Mesclagem**: Apostas movidas de um apostador para outro

## 📝 Resumo

Este endpoint permite:
- ✅ **Renomear** apostadores simplesmente
- ✅ **Mesclar** apostadores automaticamente
- ✅ **Validar** apostas no campeonato
- ✅ **Limpar** apostadores órfãos
- ✅ **Indicar** tipo de ação executada

Ideal para correção e unificação de dados de apostadores!