# 🐎 Endpoint: Listar Pareos e Cavalos

## 📋 Descrição

Endpoint para listar todos os pareos e seus respectivos cavalos de um campeonato e tipo de rodada específicos.

## 🚀 Endpoint

```
GET /pareos-cavalos/{campeonatoId}/{tipoRodadaId}
```

## 📥 Parâmetros

### **URL Parameters:**
- **`campeonatoId`** (integer): ID do campeonato
- **`tipoRodadaId`** (integer): ID do tipo de rodada

## 📤 Resposta

### **Sucesso (200):**
```json
{
  "campeonatoId": 1,
  "tipoRodadaId": 1,
  "totalPareos": 8,
  "totalCavalos": 24,
  "pareos": [
    {
      "id": 1,
      "numero": "01",
      "campeonatoId": 1,
      "tipoRodadaId": 1,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z",
      "cavalos": [
        {
          "id": 1,
          "nome": "Cavalo A",
          "identificador": "A",
          "pareoId": 1
        },
        {
          "id": 2,
          "nome": "Cavalo B",
          "identificador": "B",
          "pareoId": 1
        }
      ]
    },
    {
      "id": 2,
      "numero": "02",
      "campeonatoId": 1,
      "tipoRodadaId": 1,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z",
      "cavalos": [
        {
          "id": 3,
          "nome": "Cavalo C",
          "identificador": "A",
          "pareoId": 2
        },
        {
          "id": 4,
          "nome": "Cavalo D",
          "identificador": "B",
          "pareoId": 2
        }
      ]
    }
  ]
}
```

### **Erro (404):**
```json
{
  "statusCode": 404,
  "message": "Nenhum pareo encontrado para o campeonato 1 e tipo de rodada 1",
  "error": "Not Found"
}
```

## 🔧 Funcionalidades

### **✅ Características:**
- **Ordenação**: Pareos ordenados por número (ASC)
- **Relacionamentos**: Inclui todos os cavalos de cada pareo
- **Estatísticas**: Retorna totais de pareos e cavalos
- **Validação**: Verifica existência antes de retornar

### **🔄 Processo:**
1. **Busca** pareos por campeonato e tipo de rodada
2. **Carrega** relacionamento com cavalos
3. **Ordena** pareos por número
4. **Calcula** totais de pareos e cavalos
5. **Formata** dados de retorno
6. **Valida** se existem pareos

## 📊 Exemplo de Uso

### **Request:**
```bash
curl -X GET "http://localhost:3002/pareos-cavalos/1/1"
```

### **Response:**
```json
{
  "campeonatoId": 1,
  "tipoRodadaId": 1,
  "totalPareos": 3,
  "totalCavalos": 8,
  "pareos": [
    {
      "id": 1,
      "numero": "01",
      "campeonatoId": 1,
      "tipoRodadaId": 1,
      "cavalos": [
        { "id": 1, "nome": "Cavalo A", "identificador": "A", "pareoId": 1 },
        { "id": 2, "nome": "Cavalo B", "identificador": "B", "pareoId": 1 },
        { "id": 3, "nome": "Cavalo C", "identificador": "C", "pareoId": 1 }
      ]
    },
    {
      "id": 2,
      "numero": "02",
      "campeonatoId": 1,
      "tipoRodadaId": 1,
      "cavalos": [
        { "id": 4, "nome": "Cavalo D", "identificador": "A", "pareoId": 2 },
        { "id": 5, "nome": "Cavalo E", "identificador": "B", "pareoId": 2 }
      ]
    },
    {
      "id": 3,
      "numero": "03",
      "campeonatoId": 1,
      "tipoRodadaId": 1,
      "cavalos": [
        { "id": 6, "nome": "Cavalo F", "identificador": "A", "pareoId": 3 },
        { "id": 7, "nome": "Cavalo G", "identificador": "B", "pareoId": 3 },
        { "id": 8, "nome": "Cavalo H", "identificador": "C", "pareoId": 3 }
      ]
    }
  ]
}
```

## 🎯 Casos de Uso

### **1. Visualização Completa:**
- **Objetivo**: Ver todos os pareos e cavalos de um campeonato
- **Uso**: Interface de administração
- **Resultado**: Lista completa e organizada

### **2. Validação de Dados:**
- **Objetivo**: Verificar se pareos foram criados corretamente
- **Uso**: Testes e debugging
- **Resultado**: Confirmação de estrutura

### **3. Relatórios:**
- **Objetivo**: Gerar relatórios de pareos e cavalos
- **Uso**: Análise e estatísticas
- **Resultado**: Dados estruturados

## 📋 Estrutura de Dados

### **Pareo:**
- **`id`**: ID único do pareo
- **`numero`**: Número do pareo (ex: "01", "02")
- **`campeonatoId`**: ID do campeonato
- **`tipoRodadaId`**: ID do tipo de rodada
- **`createdAt`**: Data de criação
- **`updatedAt`**: Data de atualização
- **`cavalos`**: Array de cavalos

### **Cavalo:**
- **`id`**: ID único do cavalo
- **`nome`**: Nome do cavalo
- **`identificador`**: Identificador (A, B, C, etc.)
- **`pareoId`**: ID do pareo pai

## ⚠️ Observações

- ✅ **Ordenação**: Pareos sempre ordenados por número
- ✅ **Completo**: Inclui todos os cavalos de cada pareo
- ✅ **Estatísticas**: Retorna contadores totais
- ✅ **Validação**: Retorna erro se não encontrar pareos
- ✅ **Performance**: Uma única consulta com relacionamentos

## 🔗 Relacionamentos

- **Campeonato** → **Pareo**: Filtro por campeonato
- **TipoRodada** → **Pareo**: Filtro por tipo de rodada
- **Pareo** → **Cavalo**: Relação OneToMany carregada

## 📝 Resumo

Este endpoint permite:
- ✅ **Listar** todos os pareos de um campeonato/tipo
- ✅ **Incluir** todos os cavalos de cada pareo
- ✅ **Ordenar** pareos por número
- ✅ **Calcular** estatísticas totais
- ✅ **Validar** existência de dados

Ideal para visualização completa e relatórios de pareos e cavalos!
