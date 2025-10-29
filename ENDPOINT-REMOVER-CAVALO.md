# 🐎 Endpoint: Remover Cavalo de Pareo

## 📋 Descrição

Endpoint para remover um cavalo específico de um pareo, sem alterar valores ou outras informações.

## 🚀 Endpoint

```
POST /pareos/remover-cavalo/{campeonatoId}/{tipoRodadaId}/{numeroPareo}
```

## 📥 Parâmetros

### **URL Parameters:**
- **`campeonatoId`** (integer): ID do campeonato
- **`tipoRodadaId`** (integer): ID do tipo de rodada
- **`numeroPareo`** (string): Número do pareo (ex: "04")

### **Body (JSON):**
```json
{
  "nomeCavalo": "Cavalo 4"
}
```

## 📤 Resposta

### **Sucesso (200):**
```json
{
  "pareo": {
    "id": 1,
    "numero": "04",
    "campeonatoId": 1,
    "tipoRodadaId": 1,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T15:30:00.000Z"
  },
  "cavalosRestantes": [
    {
      "id": 1,
      "nome": "Cavalo 1",
      "identificador": "A",
      "pareoId": 1
    },
    {
      "id": 2,
      "nome": "Cavalo 2",
      "identificador": "B",
      "pareoId": 1
    },
    {
      "id": 3,
      "nome": "Cavalo 3",
      "identificador": "C",
      "pareoId": 1
    }
  ],
  "cavaloRemovido": {
    "id": 4,
    "nome": "Cavalo 4",
    "identificador": "D"
  },
  "totalCavalosAntes": 4,
  "totalCavalosDepois": 3
}
```

### **Erros:**

#### **404 - Pareo não encontrado:**
```json
{
  "statusCode": 404,
  "message": "Pareo 04 não encontrado no campeonato 1 e tipo de rodada 1",
  "error": "Not Found"
}
```

#### **404 - Cavalo não encontrado:**
```json
{
  "statusCode": 404,
  "message": "Cavalo \"Cavalo 4\" não encontrado no pareo 04",
  "error": "Not Found"
}
```

#### **404 - Último cavalo:**
```json
{
  "statusCode": 404,
  "message": "Não é possível remover o último cavalo do pareo 04. O pareo deve ter pelo menos um cavalo.",
  "error": "Not Found"
}
```

## 🔧 Funcionalidades

### **✅ Validações:**
- **Case Insensitive**: "Cavalo 4" = "cavalo 4" = "CAVALO 4"
- **Verificação de Existência**: Confirma se pareo e cavalo existem
- **Proteção Mínima**: Impede remoção do último cavalo
- **Integridade**: Mantém pareo com pelo menos 1 cavalo

### **🔄 Processo:**
1. **Normaliza** o nome do cavalo (trim)
2. **Busca** o pareo pelo campeonato, tipo e número
3. **Localiza** o cavalo pelo nome (case insensitive)
4. **Verifica** se há outros cavalos no pareo
5. **Remove** o cavalo específico
6. **Retorna** informações detalhadas

## 📊 Exemplo de Uso

### **Cenário:**
- **Pareo 04**: Cavalo 1, Cavalo 2, Cavalo 3, Cavalo 4
- **Objetivo**: Remover apenas "Cavalo 4"

### **Request:**
```bash
curl -X POST "http://localhost:3002/pareos/remover-cavalo/1/1/04" \
  -H "Content-Type: application/json" \
  -d '{
    "nomeCavalo": "Cavalo 4"
  }'
```

### **Response:**
```json
{
  "pareo": {
    "id": 1,
    "numero": "04",
    "campeonatoId": 1,
    "tipoRodadaId": 1
  },
  "cavalosRestantes": [
    { "id": 1, "nome": "Cavalo 1", "identificador": "A" },
    { "id": 2, "nome": "Cavalo 2", "identificador": "B" },
    { "id": 3, "nome": "Cavalo 3", "identificador": "C" }
  ],
  "cavaloRemovido": {
    "id": 4,
    "nome": "Cavalo 4",
    "identificador": "D"
  },
  "totalCavalosAntes": 4,
  "totalCavalosDepois": 3
}
```

## 🎯 Casos de Uso

### **1. Remoção Simples:**
- **Pareo**: 04 - Cavalo1 Cavalo2 Cavalo3 Cavalo4
- **Remover**: Cavalo4
- **Resultado**: Pareo com Cavalo1, Cavalo2, Cavalo3

### **2. Correção de Erro:**
- **Pareo**: 05 - CavaloA CavaloB CavaloErrado CavaloD
- **Remover**: CavaloErrado
- **Resultado**: Pareo com CavaloA, CavaloB, CavaloD

### **3. Ajuste de Lista:**
- **Pareo**: 06 - Cavalo1 Cavalo2 Cavalo3 Cavalo4 Cavalo5
- **Remover**: Cavalo3
- **Resultado**: Pareo com Cavalo1, Cavalo2, Cavalo4, Cavalo5

## ⚠️ Limitações

- ❌ **Não remove** o último cavalo do pareo
- ❌ **Não altera** valores de apostas
- ❌ **Não modifica** outras informações do pareo
- ✅ **Apenas remove** o cavalo específico

## 🔗 Relacionamentos

- **Pareo** → **Cavalo**: Relação OneToMany mantida
- **Apostas**: Não são afetadas pela remoção
- **Valores**: Permanecem inalterados
- **Histórico**: Preserva datas de criação

## 📝 Resumo

Este endpoint permite:
- ✅ **Remover** cavalo específico de um pareo
- ✅ **Manter** integridade mínima (pelo menos 1 cavalo)
- ✅ **Preservar** valores e apostas existentes
- ✅ **Retornar** informações detalhadas da operação
- ✅ **Validar** existência antes da remoção

Ideal para correções pontuais sem afetar o sistema de apostas!
