# 💰 Cálculo Proporcional de Pareos Excluídos

## 🎯 Correção Implementada

O valor excluído agora é calculado **proporcionalmente** ao que cada apostador apostou no pareo.

## 📊 Exemplo Prático

### Cenário:
- **Pareo 04** excluído
- **João** apostou R$ 1.000 (50%)
- **Maria** apostou R$ 1.000 (50%)
- **Total do pareo**: R$ 2.000

### ANTES (Incorreto):
```json
{
  "apostador": "João",
  "valorExcluido": 2000.00  // ❌ Valor total do pareo
}
```

### DEPOIS (Correto):
```json
{
  "apostador": "João",
  "valorExcluido": 1000.00  // ✅ Apenas proporção do João
}
```

## 🔧 Lógica Implementada

```typescript
// 1. Busca todas as apostas do pareo excluído
const apostasPareoExcluido = await this.apostaRepository.find({
  where: { pareo: { numero: "04" }
});

// 2. Calcula valor total do pareo
const valorTotalPareo = apostasPareoExcluido.reduce((sum, a) => sum + a.valorOriginal, 0);

// 3. Filtra apostas deste apostador específico
const apostasDoApostador = apostasPareoExcluido.filter(
  a => a.apostadorId === aposta.apostadorId
);

// 4. Calcula apenas a proporção deste apostador
const valorApostador = apostasDoApostador.reduce((sum, a) => sum + a.valorOriginal, 0);

// 5. Adiciona apenas a proporção
valorExcluidos += valorApostador;
```

## ✅ Benefícios

- **Precisão**: Cada apostador perde apenas o que apostou
- **Justiça**: Não penaliza apostadores que apostaram menos
- **Transparência**: Valor excluído reflete a realidade
- **Consistência**: Cálculo correto em todos os cenários

## 🧪 Casos de Teste

### Caso 1: Apostador único
- Apostador: João
- Aposta: R$ 500
- Valor excluído: R$ 500

### Caso 2: Múltiplos apostadores
- João: R$ 300 (30%)
- Maria: R$ 700 (70%)
- Valor excluído João: R$ 300
- Valor excluído Maria: R$ 700

### Caso 3: Apostador sem aposta no pareo
- João: R$ 0 no pareo 04
- Valor excluído: R$ 0

## 📝 Resumo

Agora o sistema calcula corretamente:
- ✅ **Proporção individual** de cada apostador
- ✅ **Valor real** apostado no pareo excluído
- ✅ **Sem penalização** injusta
- ✅ **Transparência** total nos cálculos
