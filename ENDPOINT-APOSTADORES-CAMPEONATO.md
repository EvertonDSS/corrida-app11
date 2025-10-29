# 👥 Endpoint: Apostadores do Campeonato

## 📋 Descrição

Endpoint para listar todos os apostadores que fizeram apostas em um campeonato específico, incluindo suas estatísticas detalhadas.

## 🚀 Endpoint

```
GET /apostadores/campeonato/{campeonatoId}
```

## 📥 Parâmetros

### **URL Parameters:**
- **`campeonatoId`** (integer): ID do campeonato

## 📤 Resposta

### **Sucesso (200):**
```json
{
  "campeonatoId": 1,
  "totalApostadores": 3,
  "apostadores": [
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
      "totalApostado": 2000.00,
      "totalPremio": 1800.00,
      "totalApostas": 8,
      "primeiraAposta": "2024-01-16T09:00:00.000Z",
      "ultimaAposta": "2024-01-21T14:00:00.000Z",
      "createdAt": "2024-01-16T09:00:00.000Z",
      "updatedAt": "2024-01-21T14:00:00.000Z"
    },
    {
      "id": 3,
      "nome": "Pedro Costa",
      "totalApostado": 800.00,
      "totalPremio": 600.00,
      "totalApostas": 3,
      "primeiraAposta": "2024-01-18T11:00:00.000Z",
      "ultimaAposta": "2024-01-22T16:00:00.000Z",
      "createdAt": "2024-01-18T11:00:00.000Z",
      "updatedAt": "2024-01-22T16:00:00.000Z"
    }
  ]
}
```

### **Sem Apostadores (200):**
```json
{
  "campeonatoId": 5,
  "totalApostadores": 0,
  "apostadores": []
}
```

## 🔧 Funcionalidades

### **✅ Características:**
- **Filtro por Campeonato**: Retorna apenas apostadores do campeonato especificado
- **Estatísticas Completas**: Inclui totais apostados, prêmios e contadores
- **Ordenação**: Apostadores ordenados por nome (ASC)
- **Validação**: Filtra apenas apostas válidas (valorPremio > 0 e valor > 0)
- **Datas**: Inclui primeira e última aposta de cada apostador

### **🔄 Processo:**
1. **Busca** apostadores únicos que fizeram apostas no campeonato
2. **Filtra** apenas apostas válidas (valorPremio > 0 e valor > 0)
3. **Calcula** estatísticas para cada apostador
4. **Ordena** apostadores por nome
5. **Formata** dados de retorno

## 📊 Exemplo de Uso

### **Request:**
```bash
curl -X GET "http://localhost:3002/apostadores/campeonato/5"
```

### **Response:**
```json
{
  "campeonatoId": 5,
  "totalApostadores": 2,
  "apostadores": [
    {
      "id": 1,
      "nome": "Ana Silva",
      "totalApostado": 1200.00,
      "totalPremio": 900.00,
      "totalApostas": 4,
      "primeiraAposta": "2024-01-15T10:00:00.000Z",
      "ultimaAposta": "2024-01-20T15:30:00.000Z",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-20T15:30:00.000Z"
    },
    {
      "id": 2,
      "nome": "Carlos Santos",
      "totalApostado": 1800.00,
      "totalPremio": 1500.00,
      "totalApostas": 6,
      "primeiraAposta": "2024-01-16T09:00:00.000Z",
      "ultimaAposta": "2024-01-21T14:00:00.000Z",
      "createdAt": "2024-01-16T09:00:00.000Z",
      "updatedAt": "2024-01-21T14:00:00.000Z"
    }
  ]
}
```

## 🎯 Casos de Uso

### **1. Dashboard de Apostadores:**
- **Objetivo**: Mostrar lista completa de apostadores
- **Uso**: Interface administrativa
- **Resultado**: Lista com estatísticas

### **2. Relatórios:**
- **Objetivo**: Gerar relatórios por campeonato
- **Uso**: Análise de dados
- **Resultado**: Dados estruturados

### **3. Ranking:**
- **Objetivo**: Mostrar apostadores mais ativos
- **Uso**: Interface de usuário
- **Resultado**: Lista ordenada por atividade

## 📋 Estrutura de Dados

### **Resposta:**
- **`campeonatoId`**: ID do campeonato consultado
- **`totalApostadores`**: Quantidade de apostadores encontrados
- **`apostadores`**: Array de apostadores com estatísticas

### **Apostador:**
- **`id`**: ID único do apostador
- **`nome`**: Nome do apostador
- **`totalApostado`**: Valor total apostado (soma dos valores reais)
- **`totalPremio`**: Valor total de prêmios
- **`totalApostas`**: Quantidade de apostas válidas
- **`primeiraAposta`**: Data da primeira aposta
- **`ultimaAposta`**: Data da última aposta
- **`createdAt`**: Data de criação do apostador
- **`updatedAt`**: Data de atualização do apostador

## ⚠️ Observações

- ✅ **Filtro Inteligente**: Só retorna apostadores com apostas válidas
- ✅ **Ordenação**: Apostadores sempre ordenados por nome
- ✅ **Estatísticas**: Inclui contadores e totais
- ✅ **Performance**: Consulta otimizada com DISTINCT
- ✅ **Validação**: Filtra apostas com valorPremio > 0 e valor > 0

## 🔗 Relacionamentos

- **Campeonato** → **Aposta**: Filtro por campeonato
- **Aposta** → **Apostador**: Relação através de apostadorId
- **Apostador**: Entidade principal retornada

## 📝 Resumo

Este endpoint permite:
- ✅ **Listar** apostadores por campeonato
- ✅ **Calcular** estatísticas detalhadas
- ✅ **Ordenar** por nome
- ✅ **Filtrar** apostas válidas
- ✅ **Incluir** datas de atividade

Ideal para dashboards e relatórios de apostadores!
