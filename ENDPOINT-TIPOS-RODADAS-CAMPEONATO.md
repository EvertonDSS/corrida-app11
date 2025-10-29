# 🎯 Endpoint: Listar Tipos de Rodadas por Campeonato

## 📋 Descrição

Endpoint para listar apenas os tipos de rodadas que existem em um campeonato específico, baseado nas apostas registradas.

## 🚀 Endpoint

```
GET /tipos-rodadas/campeonato/{campeonatoId}
```

## 📥 Parâmetros

### **URL Parameters:**
- **`campeonatoId`** (integer): ID do campeonato

## 📤 Resposta

### **Sucesso (200):**
```json
{
  "campeonatoId": 1,
  "totalTipos": 3,
  "tipos": [
    {
      "id": 1,
      "nome": "Chave",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    {
      "id": 2,
      "nome": "Individual",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    {
      "id": 3,
      "nome": "Treinador",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

### **Erro (404):**
```json
{
  "statusCode": 404,
  "message": "Nenhum tipo de rodada encontrado para o campeonato 1",
  "error": "Not Found"
}
```

## 🔧 Funcionalidades

### **✅ Características:**
- **Filtro por Campeonato**: Retorna apenas tipos que têm apostas no campeonato
- **Ordenação**: Tipos ordenados por nome (ASC)
- **Estatísticas**: Retorna total de tipos encontrados
- **Validação**: Verifica existência antes de retornar

### **🔄 Processo:**
1. **Busca** tipos de rodada únicos que têm apostas no campeonato
2. **Filtra** apenas IDs únicos
3. **Carrega** informações completas dos tipos
4. **Ordena** por nome
5. **Calcula** total de tipos
6. **Formata** dados de retorno

## 📊 Exemplo de Uso

### **Request:**
```bash
curl -X GET "http://localhost:3002/tipos-rodadas/campeonato/1"
```

### **Response:**
```json
{
  "campeonatoId": 1,
  "totalTipos": 2,
  "tipos": [
    {
      "id": 1,
      "nome": "Chave",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    {
      "id": 2,
      "nome": "Individual",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

## 🎯 Casos de Uso

### **1. Interface Dinâmica:**
- **Objetivo**: Mostrar apenas tipos de rodadas relevantes
- **Uso**: Dropdowns e filtros na interface
- **Resultado**: Lista filtrada por campeonato

### **2. Validação de Dados:**
- **Objetivo**: Verificar quais tipos têm apostas
- **Uso**: Relatórios e análises
- **Resultado**: Confirmação de tipos ativos

### **3. Navegação:**
- **Objetivo**: Permitir navegação entre tipos
- **Uso**: Menu de navegação
- **Resultado**: Lista de tipos disponíveis

## 📋 Estrutura de Dados

### **Resposta:**
- **`campeonatoId`**: ID do campeonato consultado
- **`totalTipos`**: Quantidade de tipos encontrados
- **`tipos`**: Array de tipos de rodadas

### **Tipo de Rodada:**
- **`id`**: ID único do tipo
- **`nome`**: Nome do tipo (Chave, Individual, etc.)
- **`createdAt`**: Data de criação
- **`updatedAt`**: Data de atualização

## ⚠️ Observações

- ✅ **Filtro Inteligente**: Só retorna tipos que têm apostas
- ✅ **Ordenação**: Tipos sempre ordenados por nome
- ✅ **Estatísticas**: Inclui contador total
- ✅ **Validação**: Retorna erro se não encontrar tipos
- ✅ **Performance**: Consulta otimizada com DISTINCT

## 🔗 Relacionamentos

- **Campeonato** → **Aposta**: Filtro por campeonato
- **Aposta** → **TipoRodada**: Relação através de tipoRodadaId
- **TipoRodada**: Entidade principal retornada

## 📝 Resumo

Este endpoint permite:
- ✅ **Filtrar** tipos de rodadas por campeonato
- ✅ **Retornar** apenas tipos com apostas ativas
- ✅ **Ordenar** tipos por nome
- ✅ **Calcular** estatísticas totais
- ✅ **Validar** existência de dados

Ideal para interfaces dinâmicas e relatórios específicos por campeonato!
