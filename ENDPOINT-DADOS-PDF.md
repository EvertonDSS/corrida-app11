# 📊 Endpoint: Dados Estruturados para PDF

## 🎯 Novo Endpoint

**GET** `/pdf/dados/:campeonatoId/:apostadorId`

Retorna dados estruturados em JSON para criação de PDF.

## 📋 Estrutura da Resposta

```json
{
  "apostador": {
    "id": 1,
    "nome": "João Silva",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "apostasPorRodada": [
    {
      "nomeRodada": "R01",
      "tipoRodada": {
        "id": 1,
        "nome": "Chave"
      },
      "apostas": [
        {
          "pareo": {
            "numero": "01",
            "cavalos": [
              { "nome": "Cavalo A" },
              { "nome": "Cavalo B" }
            ]
          },
          "valor": 250.00,
          "porcentagemAposta": 50,
          "valorPremio": 200.00,
          "valorOriginalPremio": 1000.00
        }
      ],
      "totalRodada": 1000.00
    }
  ],
  "totalApostado": 500.00,
  "totalPremio": 400.00,
  "totalApostas": 5,
  "totalRodadas": 2,
  "pareosExcluidos": [
    {
      "chaveRodada": "R01-1",
      "valorExcluido": 100.00
    }
  ]
}
```

## 🔧 Campos da Resposta

### **apostador**
- `id`: ID do apostador
- `nome`: Nome do apostador
- `createdAt`: Data de criação
- `updatedAt`: Data de atualização

### **apostasPorRodada** (Array)
- `nomeRodada`: Nome da rodada (ex: "R01")
- `tipoRodada`: Tipo da rodada
- `apostas`: Array de apostas da rodada
- `totalRodada`: Total da rodada

### **apostas** (Array)
- `pareo`: Dados do pareo
- `valor`: Valor da aposta
- `porcentagemAposta`: Porcentagem apostada
- `valorPremio`: Valor do prêmio individual
- `valorOriginalPremio`: Valor original do prêmio

### **Totais**
- `totalApostado`: Soma de todas as apostas
- `totalPremio`: Soma de todos os prêmios
- `totalApostas`: Quantidade de apostas
- `totalRodadas`: Quantidade de rodadas

### **pareosExcluidos** (Array)
- `chaveRodada`: Chave da rodada
- `valorExcluido`: Valor excluído

## 🧪 Exemplos de Uso

### **cURL**
```bash
curl http://localhost:3000/pdf/dados/1/1
```

### **JavaScript/Fetch**
```javascript
const response = await fetch('/pdf/dados/1/1');
const dados = await response.json();
console.log(dados);
```

### **Frontend**
```javascript
// Usar dados para criar PDF no frontend
const dados = await fetch('/pdf/dados/1/1').then(r => r.json());

// Criar PDF com jsPDF, PDFKit, etc.
const doc = new jsPDF();
doc.text(`Apostador: ${dados.apostador.nome}`, 20, 20);
// ... resto da criação do PDF
```

## ✅ Vantagens

- **Flexibilidade**: Use qualquer biblioteca de PDF
- **Frontend**: Gere PDF no cliente
- **Integração**: Use em outras aplicações
- **Debug**: Veja os dados antes de gerar PDF
- **Customização**: Controle total sobre o layout

## 🔗 Relacionado

- **PDF**: `/pdf/relatorio/:campeonatoId/:apostadorId` (gera PDF diretamente)
- **Dados**: `/pdf/dados/:campeonatoId/:apostadorId` (retorna JSON)
