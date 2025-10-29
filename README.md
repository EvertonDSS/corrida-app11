# Corrida App

Uma aplicação NestJS com PostgreSQL/SQLite para gerenciamento de campeonatos.

## 🚀 Tecnologias

- **NestJS** - Framework Node.js
- **TypeORM** - ORM para TypeScript
- **PostgreSQL/SQLite** - Banco de dados (alternável)
- **Swagger** - Documentação da API

## 📦 Deploy no Render.com

✅ **Aplicação pronta para deploy no Render.com!**

Consulte o arquivo `DEPLOY-RENDER.md` para instruções detalhadas.

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Executar migrações e popular banco
npm run seed

# Iniciar aplicação
npm run start:dev
```

## 🗄️ Banco de Dados

O projeto usa SQLite com TypeORM. O banco de dados será criado automaticamente em `database.sqlite`.

### Entidades

- **Campeonato**: Campeonatos do sistema
  - `id`: ID único (auto-incremento)
  - `nome`: Nome do campeonato
  - `createdAt`: Data de criação
  - `updatedAt`: Data de atualização

- **TipoRodada**: Tipos de rodada do sistema
  - `id`: ID único (auto-incremento)
  - `nome`: Nome do tipo de rodada
  - `createdAt`: Data de criação
  - `updatedAt`: Data de atualização

- **Rodada**: Rodadas de campeonatos
  - `id`: ID único (auto-incremento)
  - `campeonatoId`: ID do campeonato
  - `tipoRodadaId`: ID do tipo de rodada
  - `nome`: Nome da rodada
  - `createdAt`: Data de criação
  - `updatedAt`: Data de atualização

- **Pareo**: Pareos de uma rodada
  - `id`: ID único (auto-incremento)
  - `rodadaId`: ID da rodada
  - `numero`: Número do pareo
  - `createdAt`: Data de criação
  - `updatedAt`: Data de atualização

- **Cavalo**: Cavalos de um pareo
  - `id`: ID único (auto-incremento)
  - `pareoId`: ID do pareo
  - `nome`: Nome do cavalo
  - `identificador`: Identificador do cavalo no pareo (A, B, C, etc.)
  - `createdAt`: Data de criação
  - `updatedAt`: Data de atualização

- **Apostador**: Apostadores do sistema
  - `id`: ID único (auto-incremento)
  - `nome`: Nome do apostador (único)
  - `createdAt`: Data de criação
  - `updatedAt`: Data de atualização

- **Aposta**: Apostas dos apostadores
  - `id`: ID único (auto-incremento)
  - `rodadaId`: ID da rodada
  - `pareoId`: ID do pareo
  - `apostadorId`: ID do apostador
  - `valor`: Valor da aposta
  - `porcentagemAposta`: Porcentagem da aposta
  - `porcentagemPremio`: Porcentagem do prêmio
  - `valorPremio`: Valor do prêmio
  - `observacoes`: Observações da aposta
  - `createdAt`: Data de criação
  - `updatedAt`: Data de atualização

## 🔗 Endpoints

### Campeonatos

- `GET /campeonatos` - Listar todos os campeonatos
- `GET /campeonatos/:id` - Buscar campeonato por ID
- `POST /campeonatos` - Criar campeonato
- `DELETE /campeonatos/:id` - Deletar campeonato

### Tipos de Rodada

- `GET /tipos-rodada` - Listar todos os tipos de rodada
- `GET /tipos-rodada/:id` - Buscar tipo de rodada por ID
- `POST /tipos-rodada` - Criar tipo de rodada
- `DELETE /tipos-rodada/:id` - Deletar tipo de rodada

### Rodadas

- `GET /rodadas` - Listar todas as rodadas
- `GET /rodadas/:id` - Buscar rodada por ID
- `GET /rodadas/campeonato/:campeonatoId` - Buscar rodadas por campeonato
- `POST /rodadas/:campeonatoId` - Criar rodada (text/plain)

### Apostas

- `GET /apostas/rodada/:rodadaId` - Buscar apostas por rodada
- `GET /apostas/campeonato/:campeonatoId` - Buscar apostas por campeonato
- `POST /apostas/:campeonatoId/:tipoRodadaId` - Salvar apostas (text/plain)
- `POST /apostas/:campeonatoId/:rodadaId` - Salvar apostas por rodada específica (text/plain)

### PDF

- `GET /pdf/relatorio/:campeonatoId/:apostadorId` - Gerar relatório PDF do apostador

### Documentação

- `GET /api` - Swagger UI

## 📝 Exemplos de Uso

### Criar campeonato
```bash
curl -X POST http://localhost:3000/campeonatos \
  -H "Content-Type: application/json" \
  -d '{"nome": "Campeonato Brasileiro 2024"}'
```

**Nota:** Não é possível criar campeonatos com nomes duplicados (case insensitive).

### Listar campeonatos
```bash
curl http://localhost:3000/campeonatos
```

### Buscar campeonato
```bash
curl http://localhost:3000/campeonatos/1
```

### Deletar campeonato
```bash
curl -X DELETE http://localhost:3000/campeonatos/1
```

### Criar tipo de rodada
```bash
curl -X POST http://localhost:3000/tipos-rodada \
  -H "Content-Type: application/json" \
  -d '{"nome": "Eliminatória"}'
```

### Listar tipos de rodada
```bash
curl http://localhost:3000/tipos-rodada
```

### Buscar tipo de rodada
```bash
curl http://localhost:3000/tipos-rodada/1
```

### Deletar tipo de rodada
```bash
curl -X DELETE http://localhost:3000/tipos-rodada/1
```

### Criar rodada
```bash
curl -X POST http://localhost:3000/rodadas/1 \
  -H "Content-Type: text/plain" \
  -d "Chave
--------------------
01- MAXIMO SENATOR HBR
ENIGMA ON FIRE HW
SECRETA JESS STM
SERENA DASHIN MV 
/ Haras Germano, Stud Maximo, Haras Wheiseimer, Haras Trindade - G Aparecido
--------------------
02- BUENO FANTASTIC
MORENA IAMA
/ Haras Buriti, JPLK, Stud 2 Primos - J Amorim, Eder Pica Pau"
```

### Listar rodadas
```bash
curl http://localhost:3000/rodadas
```

### Buscar rodada por ID
```bash
curl http://localhost:3000/rodadas/1
```

### Buscar rodadas por campeonato
```bash
curl http://localhost:3000/rodadas/campeonato/1
```

### Salvar apostas
```bash
curl -X POST http://localhost:3000/apostas/1/1 \
  -H "Content-Type: text/plain" \
  -d "01- 800 Leonardo Miranda / Zeus ✅
02- 550 Marreco RR ✅
03- 1.200 Luca Barbosa ✅
04- 1.200 Carlinhos / Caian ✅
05- 500 Everaldo Soares ✅
06- 250 Buldog ✅ 
07- 300 Nem ✅
08- 200 Joselino ✅

TOTAL R$ 5.000,00
Retirada 20%, Credenciado ao evento"
```

### Salvar apostas por rodada específica
```bash
curl -X POST http://localhost:3000/apostas/1/1 \
  -H "Content-Type: text/plain" \
  -d "R02

01- 700 Geraldo Z ✅
02- 700 Aidan Melville ✅
03- 1.200 Joaquim ✅
04- ❌ (fora da rodada)
05- 500 Tiago Saldanha ✅
06- 250 Buldog ✅ 2/5
07- 300 Nem ✅
08- 250 Garra / Hércules ✅ 1/2

TOTAL R$ 3.900,00

Retirada 20%, Credenciado ao evento"
```

**Funcionalidade de Remoção Automática:**
- Apostas marcadas com ❌ são automaticamente removidas de todas as rodadas do campeonato e tipo
- O valor removido é subtraído do total apostado
- Todas as apostas existentes são recalculadas com os novos valores
- O retorno inclui `valorRemovido` e `message` para rastreabilidade
- **PDF Atualizado**: Relatórios PDF mostram apenas apostas válidas (não removidas)
- **Nome da Rodada**: PDF exibe o nome correto da rodada (ex: "R01") extraído até o ponto e vírgula (`;`)

### Buscar apostas por rodada
```bash
curl http://localhost:3000/apostas/rodada/1
```

### Buscar apostas por campeonato
```bash
curl http://localhost:3000/apostas/campeonato/1
```

### Gerar relatório PDF
```bash
curl -O http://localhost:3000/pdf/relatorio/1/1
```

## 🛠️ Scripts Disponíveis

- `npm run start:dev` - Iniciar em modo desenvolvimento
- `npm run build` - Compilar aplicação
- `npm run seed` - Popular banco com dados iniciais
- `npm run test` - Executar testes
- `npm run lint` - Verificar código

## 📁 Estrutura do Projeto

```
src/
├── controllers/     # Controllers da aplicação
├── entities/        # Entidades do banco de dados
├── dto/            # Data Transfer Objects
├── services/        # Serviços de negócio
├── app.module.ts    # Módulo principal
└── main.ts         # Arquivo de inicialização
```

## 🔧 Configuração

O banco SQLite é configurado automaticamente com:
- **Database**: `database.sqlite`
- **Synchronize**: `true` (apenas para desenvolvimento)
- **Entities**: Todas as entidades são carregadas automaticamente

## ✅ Validações

### Campeonatos
- **Nome único**: Não permite criar campeonatos com nomes duplicados (case insensitive)
- **Nome obrigatório**: Campo nome é obrigatório
- **Tamanho mínimo**: Nome deve ter pelo menos 3 caracteres
- **Tamanho máximo**: Nome deve ter no máximo 100 caracteres

### Tipos de Rodada
- **Nome único**: Não permite criar tipos de rodada com nomes duplicados (case insensitive)
- **Nome obrigatório**: Campo nome é obrigatório
- **Tamanho mínimo**: Nome deve ter pelo menos 3 caracteres
- **Tamanho máximo**: Nome deve ter no máximo 50 caracteres