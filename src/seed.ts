import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CampeonatoService } from './services/campeonato.service';
import { TipoRodadaService } from './services/tipo-rodada.service';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const campeonatoService = app.get(CampeonatoService);
  const tipoRodadaService = app.get(TipoRodadaService);

  try {
    // Criar alguns campeonatos de exemplo
    await campeonatoService.create({
      nome: 'Campeonato Brasileiro 2024'
    });

    await campeonatoService.create({
      nome: 'Copa do Brasil 2024'
    });

    await campeonatoService.create({
      nome: 'Libertadores 2024'
    });

    // Criar alguns tipos de rodada de exemplo
    await tipoRodadaService.create({
      nome: 'Chave'
    });

    await tipoRodadaService.create({
      nome: 'Eliminatória'
    });

    await tipoRodadaService.create({
      nome: 'Classificatória'
    });

    await tipoRodadaService.create({
      nome: 'Final'
    });

    console.log('✅ Dados iniciais criados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar dados iniciais:', error);
  } finally {
    await app.close();
  }
}

seed();
