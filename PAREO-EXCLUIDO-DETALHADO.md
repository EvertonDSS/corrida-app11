# 📊 Pareos Excluídos Detalhados

## ✅ Estrutura Atualizada

Agora o campo `pareosExcluidos` retorna informações mais detalhadas:

### **ANTES** (simples):
```json
"pareosExcluidos": [
  {
    "chaveRodada": "R02-2",
    "valorExcluido": 0
  }
]
```

### **DEPOIS** (detalhado):
```json
"pareosExcluidos": [
  {
    "nomeRodada": "R02",
    "tipoRodada": {
      "id": 2,
      "nome": "Chave"
    },
    "numeroPareo": "02",
    "valorExcluido": 500.00,
    "temApostasAtivas": true,
    "quantidadeApostas": 3,
    "dadosPareo": "02",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
]
```

## 🔧 Campos da Resposta

### **Informações Básicas**
- `nomeRodada`: Nome da rodada (ex: "R02")
- `numeroPareo`: Número do pareo excluído (ex: "02")
- `dadosPareo`: Dados originais do pareo
- `createdAt`: Data de exclusão

### **Tipo de Rodada**
- `tipoRodada.id`: ID do tipo de rodada
- `tipoRodada.nome`: Nome do tipo (ex: "Chave", "Individual")

### **Valores e Estatísticas**
- `valorExcluido`: Valor total excluído (soma das apostas ativas)
- `temApostasAtivas`: Se há apostas ativas no pareo excluído
- `quantidadeApostas`: Quantidade de apostas no pareo excluído

## 📊 Lógica de Cálculo

### **Valor Excluído**
```typescript
// Só calcula valor se houver apostas ativas
const valorExcluido = apostasPareoExcluido.length > 0 
  ? apostasPareoExcluido.reduce((sum, a) => sum + Number(a.valorOriginal), 0)
  : 0;
```

### **Condições**
- ✅ **Com apostas ativas**: Calcula valor real excluído
- ❌ **Sem apostas ativas**: Valor = 0 (não afeta cálculos)

## 🧪 Exemplo Completo

```json
{
  "apostador": {
    "id": 1,
    "nome": "João Silva"
  },
  "apostasPorRodada": [...],
  "totalApostado": 1500.00,
  "totalPremio": 1200.00,
  "pareosExcluidos": [
    {
      "nomeRodada": "R01",
      "tipoRodada": {
        "id": 1,
        "nome": "Chave"
      },
      "numeroPareo": "04",
      "valorExcluido": 800.00,
      "temApostasAtivas": true,
      "quantidadeApostas": 2,
      "dadosPareo": "04",
      "createdAt": "2024-01-15T10:00:00.000Z"
    },
    {
      "nomeRodada": "R02",
      "tipoRodada": {
        "id": 2,
        "nome": "Individual"
      },
      "numeroPareo": "07",
      "valorExcluido": 0,
      "temApostasAtivas": false,
      "quantidadeApostas": 0,
      "dadosPareo": "07",
      "createdAt": "2024-01-16T14:30:00.000Z"
    }
  ]
}
```

## ✅ Benefícios

- **Transparência**: Mostra exatamente o que foi excluído
- **Detalhamento**: Tipo de rodada e valores específicos
- **Rastreabilidade**: Data de exclusão e dados originais
- **Precisão**: Valor real excluído baseado em apostas ativas
- **Debug**: Fácil identificação de problemas
