# 🎯 Correção: Valor Excluído por Rodada Específica

## 🚨 Problema Identificado

O valor excluído estava sendo calculado **por tipo de rodada** e não **por rodada específica**, causando:

- ❌ **R01**: Valor excluído = R$ 1.200
- ❌ **R02**: Valor excluído = R$ 1.200  
- ❌ **R03**: Valor excluído = R$ 1.000
- ❌ **Total**: R$ 3.400 (soma de todas as rodadas)

## ✅ Solução Implementada

Agora o valor excluído é calculado **por rodada específica** (nomeRodada + tipoRodadaId):

- ✅ **R01**: Valor excluído = R$ 1.200 (apenas desta rodada)
- ✅ **R02**: Valor excluído = R$ 1.200 (apenas desta rodada)
- ✅ **R03**: Valor excluído = R$ 1.000 (apenas desta rodada)

## 🔧 Mudanças Técnicas

### **1. Método `buscarPareosExcluidos`**

**ANTES** (Incorreto):
```typescript
// Calculava por tipo de rodada (sem filtrar por nomeRodada)
const apostasPareoExcluido = await this.apostaRepository.find({
  where: {
    campeonatoId,
    tipoRodadaId: excluido.tipoRodadaId,
    pareo: { numero: excluido.numeroPareo }
  }
});
```

**DEPOIS** (Correto):
```typescript
// Calcula por rodada específica (nomeRodada + tipoRodadaId)
const apostasPareoExcluido = await this.apostaRepository.find({
  where: {
    campeonatoId,
    tipoRodadaId: excluido.tipoRodadaId,
    nomeRodada: primeiraAposta.nomeRodada, // ✅ Filtra pela rodada específica
    pareo: { numero: excluido.numeroPareo }
  }
});
```

### **2. Método `buscarPareosExcluidosDetalhados`**

**ANTES** (Incorreto):
```typescript
// Agrupava apenas por tipo de rodada
const tiposRodadaUnicos = [...new Set(apostas.map(a => a.tipoRodadaId))];
```

**DEPOIS** (Correto):
```typescript
// Agrupa por rodada específica (nomeRodada + tipoRodadaId)
const apostasPorRodada = new Map<string, Aposta[]>();
for (const aposta of apostas) {
  const chaveRodada = `${aposta.nomeRodada}-${aposta.tipoRodadaId}`;
  // ...
}
```

## 📊 Exemplo Prático

### **Cenário:**
- **R01-Chave**: Pareo 04 excluído = R$ 1.200
- **R02-Chave**: Pareo 04 excluído = R$ 1.200
- **R03-Chave**: Pareo 04 excluído = R$ 1.000

### **ANTES** (Incorreto):
```json
{
  "pareosExcluidos": [
    { "chaveRodada": "R01-2", "valorExcluido": 3400.00 }, // ❌ Soma de todas
    { "chaveRodada": "R02-2", "valorExcluido": 3400.00 }, // ❌ Soma de todas
    { "chaveRodada": "R03-2", "valorExcluido": 3400.00 }  // ❌ Soma de todas
  ]
}
```

### **DEPOIS** (Correto):
```json
{
  "pareosExcluidos": [
    { "chaveRodada": "R01-2", "valorExcluido": 1200.00 }, // ✅ Apenas R01
    { "chaveRodada": "R02-2", "valorExcluido": 1200.00 }, // ✅ Apenas R02
    { "chaveRodada": "R03-2", "valorExcluido": 1000.00 }  // ✅ Apenas R03
  ]
}
```

## 🎯 Benefícios

- ✅ **Precisão**: Cada rodada tem seu valor excluído correto
- ✅ **Isolamento**: Rodadas não interferem umas nas outras
- ✅ **Transparência**: Valor excluído reflete apenas a rodada específica
- ✅ **Consistência**: Alinhado com a lógica de negócio

## 🔄 Campos Atualizados

### **`buscarPareosExcluidosDetalhados`**
- ✅ **`chaveRodada`**: Inclui identificador único da rodada
- ✅ **`nomeRodada`**: Nome específico da rodada (R01, R02, etc.)
- ✅ **`tipoRodada`**: Tipo da rodada (Chave, Individual, etc.)
- ✅ **`valorExcluido`**: Valor específico desta rodada

## 📝 Resumo

Agora o sistema calcula corretamente:
- ✅ **Por rodada específica**: R01 ≠ R02 ≠ R03
- ✅ **Valor isolado**: Cada rodada tem seu próprio valor excluído
- ✅ **Filtro correto**: `nomeRodada` + `tipoRodadaId`

O cálculo de pareos excluídos está agora alinhado com a realidade das apostas por rodada!
