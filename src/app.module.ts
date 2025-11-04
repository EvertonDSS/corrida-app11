import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CampeonatoController } from './controllers/campeonato.controller';
import { CampeonatoService } from './services/campeonato.service';
import { Campeonato } from './entities/campeonato.entity';
import { TipoRodadaController } from './controllers/tipo-rodada.controller';
import { TipoRodadaService } from './services/tipo-rodada.service';
import { TipoRodada } from './entities/tipo-rodada.entity';
import { Pareo } from './entities/pareo.entity';
import { Cavalo } from './entities/cavalo.entity';
import { ApostaController } from './controllers/aposta.controller';
import { ApostaService } from './services/aposta.service';
import { Aposta } from './entities/aposta.entity';
import { Apostador } from './entities/apostador.entity';
import { PdfController } from './controllers/pdf.controller';
import { PdfService } from './services/pdf.service';
import { PareoController } from './controllers/pareo.controller';
import { PareoService } from './services/pareo.service';
import { PareoExcluidoController } from './controllers/pareo-excluido.controller';
import { PareoExcluidoService } from './services/pareo-excluido.service';
import { PareoExcluido } from './entities/pareo-excluido.entity';
import { ApostadorController } from './controllers/apostador.controller';
import { ApostadorService } from './services/apostador.service';
import { PareosCavalosController } from './controllers/pareos-cavalos.controller';
import { SaldoController } from './controllers/saldo.controller';
import { SaldoService } from './services/saldo.service';
import { TiposRodadasController } from './controllers/tipos-rodadas.controller';
import { RodadaCasaController } from './controllers/rodada-casa.controller';
import { RodadaCasaService } from './services/rodada-casa.service';
import { RodadaCasa } from './entities/rodada-casa.entity';
import { RodadasCavalosController } from './controllers/rodadas-cavalos.controller';
import { GanhadorPossivelController } from './controllers/ganhador-possivel.controller';
import { GanhadorPossivelService } from './services/ganhador-possivel.service';
import { GanhadorPossivel } from './entities/ganhador-possivel.entity';
import { getDatabaseConfig } from './config/database.config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...getDatabaseConfig(),
      entities: [Campeonato, TipoRodada, Pareo, Cavalo, Aposta, Apostador, PareoExcluido, RodadaCasa, GanhadorPossivel],
    }),
    TypeOrmModule.forFeature([Campeonato, TipoRodada, Pareo, Cavalo, Aposta, Apostador, PareoExcluido, RodadaCasa, GanhadorPossivel]),
  ],
  controllers: [AppController, CampeonatoController, TipoRodadaController, ApostaController, PdfController, PareoController, PareoExcluidoController, ApostadorController, PareosCavalosController, TiposRodadasController, SaldoController, RodadaCasaController, RodadasCavalosController, GanhadorPossivelController],
  providers: [AppService, CampeonatoService, TipoRodadaService, ApostaService, PdfService, PareoService, PareoExcluidoService, ApostadorService, SaldoService, RodadaCasaService, GanhadorPossivelService],
})
export class AppModule {}
