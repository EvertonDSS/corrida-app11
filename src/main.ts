
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração do middleware para text/plain
  app.use('/rodadas', express.raw({ type: 'text/plain' }));
  app.use('/apostas', express.raw({ type: 'text/plain' }));
  app.use('/pareos', express.raw({ type: 'text/plain' }));

  const config = new DocumentBuilder()
    .setTitle('Corrida App')
    .setDescription('API para gerenciamento de corridas e campeonatos')
    .setVersion('1.0')
    .addTag('campeonatos', 'Operações relacionadas a campeonatos')
    .addTag('tipos-rodada', 'Operações relacionadas a tipos de rodada')
    .addTag('pareos', 'Operações relacionadas a pareos e cavalos')
    .addTag('pareos-excluidos', 'Operações relacionadas a pareos excluídos')
    .addTag('apostas', 'Operações relacionadas a apostas')
    .addTag('pdf', 'Geração de relatórios em PDF')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
