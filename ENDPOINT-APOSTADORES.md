# 👥 Endpoint: Apostadores do Campeonato

## 🎯 Novos Endpoints

### **GET** `/apostadores`
Lista todos os apostadores cadastrados.

### **GET** `/apostadores/:id`
Busca apostador específico por ID.

### **GET** `/apostadores/campeonato/:campeonatoId`
Lista apostadores que fizeram apostas em um campeonato específico.

## 📋 Estrutura da Resposta

### **Lista de Apostadores do Campeonato**

```json
[
  {
    "id": 1,
    "nome": "João Silva",
    "totalApostado": 1500.00,
    "totalPremio": 1200.00,
    "totalApostas": 5,
    "primeiraAposta": "2024-01-15T10:00:00.000Z",
    "ultimaAposta": "2024-01-20T15:30:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-20T15:30:00.000Z"
  },
  {
    "id": 2,
    "nome": "Maria Santos",
    "totalApostado": 800.00,
    "totalPremio": 600.00,
    "totalApostas": 3,
    "primeiraAposta": "2024-01-16T09:00:00.000Z",
    "ultimaAposta": "2024-01-18T14:20:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-18T14:20:00.000Z"
  }
]
```

## 🔧 Campos da Resposta

### **Dados Básicos**
- `id`: ID único do apostador
- `nome`: Nome do apostador
- `createdAt`: Data de cadastro
- `updatedAt`: Data da última atualização

### **Estatísticas do Campeonato**
- `totalApostado`: Soma de todas as apostas no campeonato
- `totalPremio`: Soma de todos os prêmios no campeonato
- `totalApostas`: Quantidade de apostas feitas
- `primeiraAposta`: Data da primeira aposta
- `ultimaAposta`: Data da última aposta

## 🧪 Exemplos de Uso

### **Listar todos os apostadores**
```bash
curl http://localhost:3000/apostadores
```

### **Buscar apostador específico**
```bash
curl http://localhost:3000/apostadores/1
```

### **Apostadores do campeonato**
```bash
curl http://localhost:3000/apostadores/campeonato/1
```

### **JavaScript/Fetch**
```javascript
// Apostadores do campeonato
const response = await fetch('/apostadores/campeonato/1');
const apostadores = await response.json();

console.log(`Total de apostadores: ${apostadores.length}`);
apostadores.forEach(apostador => {
  console.log(`${apostador.nome}: R$ ${apostador.totalApostado}`);
});
```

## 📊 Funcionalidades

### **Filtros Aplicados**
- ✅ Apenas apostas válidas (`valorPremio > 0` e `valor > 0`)
- ✅ Apenas apostadores que fizeram apostas no campeonato
- ✅ Ordenação alfabética por nome

### **Cálculos Automáticos**
- ✅ Soma de valores apostados
- ✅ Soma de prêmios recebidos
- ✅ Contagem de apostas
- ✅ Datas de primeira e última aposta

## 🔗 Integração com PDF

```javascript
// Obter lista de apostadores
const apostadores = await fetch('/apostadores/campeonato/1').then(r => r.json());

// Gerar PDF para cada apostador
for (const apostador of apostadores) {
  const pdfUrl = `/pdf/relatorio/1/${apostador.id}`;
  console.log(`PDF: ${pdfUrl}`);
}
```

## ✅ Vantagens

- **Estatísticas**: Dados consolidados por apostador
- **Filtros**: Apenas apostas válidas
- **Performance**: Query otimizada
- **Integração**: Fácil uso com outros endpoints
- **Swagger**: Documentação automática em `/api`

## 📝 Notas

- Apostas removidas (❌) não são contabilizadas
- Valores são calculados com precisão de 2 casas decimais
- Datas seguem formato ISO 8601
- Ordenação alfabética por nome do apostador
