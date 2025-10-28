import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import PDFDocument from 'pdfkit';
import { Aposta } from '../entities/aposta.entity';
import { Apostador } from '../entities/apostador.entity';
import { Pareo } from '../entities/pareo.entity';
import { Cavalo } from '../entities/cavalo.entity';
import { PareoExcluido } from '../entities/pareo-excluido.entity';

@Injectable()
export class PdfService {
  constructor(
    @InjectRepository(Aposta)
    private apostaRepository: Repository<Aposta>,
    @InjectRepository(Apostador)
    private apostadorRepository: Repository<Apostador>,
    @InjectRepository(Pareo)
    private pareoRepository: Repository<Pareo>,
    @InjectRepository(Cavalo)
    private cavaloRepository: Repository<Cavalo>,
    @InjectRepository(PareoExcluido)
    private pareoExcluidoRepository: Repository<PareoExcluido>,
  ) {}

  async obterDadosEstruturados(campeonatoId: number, apostadorId: number): Promise<any> {
    // Busca o apostador
    const apostador = await this.apostadorRepository.findOne({
      where: { id: apostadorId },
    });

    if (!apostador) {
      throw new NotFoundException('Apostador não encontrado');
    }

    // Busca apostas
    const apostas = await this.apostaRepository
      .createQueryBuilder('aposta')
      .leftJoinAndSelect('aposta.tipoRodada', 'tipoRodada')
      .leftJoinAndSelect('aposta.pareo', 'pareo')
      .leftJoinAndSelect('aposta.apostador', 'apostador')
      .leftJoinAndSelect('pareo.cavalos', 'cavalos')
      .where('aposta.apostadorId = :apostadorId', { apostadorId })
      .andWhere('aposta.campeonatoId = :campeonatoId', { campeonatoId })
      .andWhere('aposta.valorPremio > 0')
      .andWhere('aposta.valor > 0')
      .orderBy('aposta.updatedAt', 'DESC')
      .addOrderBy('pareo.numero', 'ASC')
      .getMany();

    const pareosExcluidos = await this.buscarPareosExcluidos(campeonatoId, apostas);
    const apostasPorRodada = this.agruparApostasPorRodada(apostas, pareosExcluidos);

    const totalApostado = apostas.reduce((sum, aposta) => sum + Number(aposta.valor), 0);
    const totalPremio = apostas.reduce((sum, aposta) => sum + Number(aposta.valorPremio), 0);

    // Converte Map para Array para JSON
    const apostasPorRodadaArray = Array.from(apostasPorRodada.values());

    return {
      apostador: {
        id: apostador.id,
        nome: apostador.nome,
        createdAt: apostador.createdAt,
        updatedAt: apostador.updatedAt
      },
      apostasPorRodada: apostasPorRodadaArray,
      totalApostado: Number(totalApostado.toFixed(2)),
      totalPremio: Number(totalPremio.toFixed(2)),
      totalApostas: apostas.length,
      totalRodadas: apostasPorRodadaArray.length,
      pareosExcluidos: Array.from(pareosExcluidos.entries()).map(([chave, valor]) => ({
        chaveRodada: chave,
        valorExcluido: valor
      }))
    };
  }

  async gerarRelatorioApostador(campeonatoId: number, apostadorId: number): Promise<Buffer> {
    // Tenta usar PDFKit primeiro (funciona no Render)
    try {
      return await this.gerarPdfComPdfKit(campeonatoId, apostadorId);
    } catch (error) {
      console.log('Erro com PDFKit, tentando Puppeteer...', error.message);
      return await this.gerarPdfComPuppeteer(campeonatoId, apostadorId);
    }
  }

  private async gerarPdfComPdfKit(campeonatoId: number, apostadorId: number): Promise<Buffer> {
    // Busca o apostador
    const apostador = await this.apostadorRepository.findOne({
      where: { id: apostadorId },
    });

    if (!apostador) {
      throw new NotFoundException('Apostador não encontrado');
    }

    // Busca apostas
    const apostas = await this.apostaRepository
      .createQueryBuilder('aposta')
      .leftJoinAndSelect('aposta.tipoRodada', 'tipoRodada')
      .leftJoinAndSelect('aposta.pareo', 'pareo')
      .leftJoinAndSelect('aposta.apostador', 'apostador')
      .leftJoinAndSelect('pareo.cavalos', 'cavalos')
      .where('aposta.apostadorId = :apostadorId', { apostadorId })
      .andWhere('aposta.campeonatoId = :campeonatoId', { campeonatoId })
      .andWhere('aposta.valorPremio > 0')
      .andWhere('aposta.valor > 0')
      .orderBy('aposta.updatedAt', 'DESC')
      .addOrderBy('pareo.numero', 'ASC')
      .getMany();

    const pareosExcluidos = await this.buscarPareosExcluidos(campeonatoId, apostas);
    const apostasPorRodada = this.agruparApostasPorRodada(apostas, pareosExcluidos);

    const totalApostado = apostas.reduce((sum, aposta) => sum + Number(aposta.valor), 0);
    const totalPremio = apostas.reduce((sum, aposta) => sum + Number(aposta.valorPremio), 0);

    // Cria o documento PDF
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 72 });
    
    doc.on('data', (chunk) => chunks.push(chunk));
    
    // Header
    doc.fontSize(18).fillColor('#D4AF37').text('🐎 JOGOS ONLINE', 72, 72, { align: 'center' });
    doc.fontSize(14).text(apostador.nome, 72, 100, { align: 'center' });
    doc.fontSize(20).text('RELATÓRIO DE APOSTAS', 72, 130, { align: 'center' });
    
    let y = 180;
    
    // Tabela de apostas
    doc.fontSize(10).fillColor('#D4AF37');
    doc.text('RODADA', 72, y);
    doc.text('CHAVE', 120, y);
    doc.text('VALOR', 250, y);
    doc.text('%', 310, y);
    doc.text('PRÊMIO', 340, y);
    doc.text('TOTAL RODADA', 400, y);
    
    y += 20;
    
    let currentRodada = '';
    for (const [key, rodada] of apostasPorRodada) {
      for (let i = 0; i < rodada.apostas.length; i++) {
        const aposta = rodada.apostas[i];
        const cavalos = aposta.pareo.cavalos.map((c: any) => c.nome).join(' / ');
        const isUltima = i === rodada.apostas.length - 1;
        
        if (isUltima && rodada.nomeRodada !== currentRodada) {
          doc.fillColor('#000000').fontSize(8).text(rodada.nomeRodada, 72, y);
          currentRodada = rodada.nomeRodada;
        }
        
        const chaveText = `${aposta.pareo.numero}- ${cavalos}`;
        doc.text(chaveText.substring(0, 20), 120, y);
        doc.text(`R$ ${aposta.valor.toFixed(2)}`, 250, y);
        doc.text(`${aposta.porcentagemAposta}%`, 310, y);
        doc.text(`R$ ${aposta.valorPremio.toFixed(2)}`, 340, y);
        
        if (isUltima) {
          doc.text(`R$ ${aposta.valorOriginalPremio.toFixed(2)}`, 400, y);
        }
        
        y += 15;
        
        // Pula página se necessário
        if (y > 700) {
          doc.addPage();
          y = 72;
        }
      }
    }
    
    doc.fontSize(12).fillColor('#D4AF37').text('TOTAL APOSTADO:', 72, y + 20);
    doc.fillColor('#000000').text(`R$ ${totalApostado.toFixed(2)}`, 200, y + 20);
    doc.fillColor('#D4AF37').text('TOTAL PRÊMIO:', 72, y + 40);
    doc.fillColor('#000000').text(`R$ ${totalPremio.toFixed(2)}`, 200, y + 40);
    
    doc.end();
    
    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  private async gerarPdfComPuppeteer(campeonatoId: number, apostadorId: number): Promise<Buffer> {
    // Busca o apostador
    const apostador = await this.apostadorRepository.findOne({
      where: { id: apostadorId },
    });

    if (!apostador) {
      throw new NotFoundException('Apostador não encontrado');
    }

    // Busca todas as apostas do apostador no campeonato (apenas apostas válidas/atuais)
    const apostas = await this.apostaRepository
      .createQueryBuilder('aposta')
      .leftJoinAndSelect('aposta.tipoRodada', 'tipoRodada')
      .leftJoinAndSelect('aposta.pareo', 'pareo')
      .leftJoinAndSelect('aposta.apostador', 'apostador')
      .leftJoinAndSelect('pareo.cavalos', 'cavalos')
      .where('aposta.apostadorId = :apostadorId', { apostadorId })
      .andWhere('aposta.campeonatoId = :campeonatoId', { campeonatoId })
      .andWhere('aposta.valorPremio > 0') // Filtra apostas válidas (não removidas)
      .andWhere('aposta.valor > 0') // Filtra apostas com valor válido
      .orderBy('aposta.updatedAt', 'DESC') // Ordena por data de atualização mais recente
      .addOrderBy('pareo.numero', 'ASC')
      .getMany();

    if (apostas.length === 0) {
      throw new NotFoundException('Nenhuma aposta encontrada para este apostador no campeonato');
    }

        // Busca pareos excluídos para calcular o prêmio individual correto
        const pareosExcluidos = await this.buscarPareosExcluidos(campeonatoId, apostas);

        // Agrupa apostas por rodada (apenas apostas válidas)
        const apostasPorRodada = this.agruparApostasPorRodada(apostas, pareosExcluidos);

        // Calcula totais
        const totalApostado = apostas.reduce((sum, aposta) => sum + Number(aposta.valor), 0);
        const totalPremio = apostas.reduce((sum, aposta) => sum + Number(aposta.valorPremio), 0);

    // Gera HTML
    const html = this.gerarHtmlRelatorio(apostador, apostasPorRodada, totalApostado, totalPremio);

    // Gera PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-notifications',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--disable-translate',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--enable-automation',
        '--password-store=basic',
        '--use-mock-keychain',
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
    });

    await browser.close();

    return Buffer.from(pdf);
  }

  private async buscarPareosExcluidos(campeonatoId: number, apostas: Aposta[]): Promise<Map<string, number>> {
    const pareosExcluidos = new Map<string, number>();
    
    // Busca todos os pareos excluídos do campeonato
    const excluidos = await this.pareoExcluidoRepository.find({
      where: { campeonatoId },
    });

    // Para cada aposta, verifica se há pareos excluídos do mesmo tipo de rodada
    for (const aposta of apostas) {
      const chaveRodada = `${aposta.nomeRodada}-${aposta.tipoRodadaId}`;
      
      if (!pareosExcluidos.has(chaveRodada)) {
        // Busca pareos excluídos do mesmo tipo de rodada
        const excluidosTipo = excluidos.filter(e => e.tipoRodadaId === aposta.tipoRodadaId);
        
        // Calcula o valor total dos pareos excluídos para este tipo
        let valorExcluidos = 0;
        for (const excluido of excluidosTipo) {
          // Busca apostas ativas do pareo excluído para verificar se existem
          const apostasPareoExcluido = await this.apostaRepository.find({
            where: {
              campeonatoId,
              tipoRodadaId: excluido.tipoRodadaId,
              pareo: { numero: excluido.numeroPareo }
            },
            relations: ['pareo']
          });
          
          // Só adiciona o valor se houver apostas ativas no pareo excluído
          if (apostasPareoExcluido.length > 0) {
            const valorPareoExcluido = apostasPareoExcluido.reduce((sum, a) => sum + a.valorOriginal, 0);
            valorExcluidos += valorPareoExcluido;
          }
        }
        
        pareosExcluidos.set(chaveRodada, valorExcluidos);
      }
    }

    return pareosExcluidos;
  }

  private agruparApostasPorRodada(apostas: Aposta[], pareosExcluidos: Map<string, number>): Map<string, any> {
    const agrupadas = new Map();

    for (const aposta of apostas) {
      const chaveRodada = `${aposta.nomeRodada}-${aposta.tipoRodadaId}`;

      if (!agrupadas.has(chaveRodada)) {
        agrupadas.set(chaveRodada, {
          nomeRodada: aposta.nomeRodada,
          tipoRodada: aposta.tipoRodada,
          apostas: [],
          totalRodada: 0,
        });
      }

      // Calcula o prêmio individual considerando pareos excluídos
      const valorExcluidos = pareosExcluidos.get(chaveRodada) || 0;
      const valorPremioAjustado = Number(aposta.valorOriginalPremio) - valorExcluidos;
      const valorPremioComRetirada = valorPremioAjustado * (1 - Number(aposta.porcentagemRetirada) / 100);
      const premioIndividual = valorPremioComRetirada * (Number(aposta.porcentagemPremio) / 100);

      // Calcula o valor real da aposta (considerando a porcentagem)
      const valorApostaReal = Number(aposta.valorOriginal) * (Number(aposta.porcentagemAposta) / 100);

      // Cria uma cópia da aposta com os valores calculados
      const apostaComValoresCalculados = {
        ...aposta,
        valor: valorApostaReal, // Valor real apostado pelo apostador
        valorPremio: premioIndividual // Prêmio individual calculado
      };

      agrupadas.get(chaveRodada).apostas.push(apostaComValoresCalculados);
      
      // Atualiza o total da rodada apenas uma vez (valor total após retirada)
      if (!agrupadas.get(chaveRodada).totalRodadaCalculado) {
        agrupadas.get(chaveRodada).totalRodada = valorPremioComRetirada;
        agrupadas.get(chaveRodada).totalRodadaCalculado = true;
      }
    }

    return agrupadas;
  }

  private gerarHtmlRelatorio(apostador: Apostador, apostasPorRodada: Map<string, any>, totalApostado: number, totalPremio: number): string {
    const rodadas = Array.from(apostasPorRodada.values());

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Apostas - ${apostador.nome}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #D4AF37;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .logo-icon {
            width: 40px;
            height: 40px;
            background: #D4AF37;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
        }

        .logo-text {
            font-size: 18px;
            font-weight: bold;
            color: #D4AF37;
        }

        .apostador-name {
            background: #D4AF37;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 14px;
        }

        .title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            color: #D4AF37;
            margin-bottom: 30px;
        }

        .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        .table th {
            background: #D4AF37;
            color: white;
            padding: 12px 8px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #B8941F;
        }

        .table td {
            padding: 10px 8px;
            text-align: center;
            border: 1px solid #ddd;
            background: white;
        }

        .table tr:nth-child(even) td {
            background: #f9f9f9;
        }

        .cavalos {
            font-size: 11px;
            color: #666;
            margin-top: 2px;
        }

        .valor {
            font-weight: bold;
            color: #2E7D32;
        }

        .porcentagem {
            color: #1976D2;
            font-weight: bold;
        }

        .premio {
            color: #D4AF37;
            font-weight: bold;
        }

        .total-rodada {
            background: #E8F5E8 !important;
            font-weight: bold;
            color: #2E7D32;
        }

        .summary {
            margin-top: 30px;
        }

        .summary-section {
            margin-bottom: 20px;
        }

        .summary-title {
            background: #D4AF37;
            color: white;
            padding: 8px 12px;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .summary-value {
            background: #D4AF37;
            color: white;
            padding: 8px 12px;
            font-weight: bold;
            font-size: 16px;
        }

        .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        .summary-table th {
            background: #D4AF37;
            color: white;
            padding: 8px 12px;
            text-align: left;
            font-weight: bold;
        }

        .summary-table td {
            padding: 8px 12px;
            border: 1px solid #ddd;
            background: white;
        }

        .boloes-chave {
            background: #FFF3E0 !important;
        }

        .chaves-individuais {
            background: #E3F2FD !important;
        }

        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <div class="logo-icon">🐎</div>
            <div class="logo-text">JOGOS ONLINE</div>
        </div>
        <div class="apostador-name">${apostador.nome}</div>
    </div>

    <div class="title">RELATÓRIO DE APOSTAS</div>

    <table class="table">
        <thead>
            <tr>
                <th>RODADA</th>
                <th>CHAVE</th>
                <th>VALOR DA APOSTA</th>
                <th>%</th>
                <th>PRÊMIO INDIVIDUAL</th>
                <th>TOTAL DA RODADA</th>
            </tr>
        </thead>
        <tbody>
            ${rodadas.map(rodada => this.gerarLinhasRodada(rodada)).join('')}
        </tbody>
    </table>

    <div class="summary">
        <div class="summary-section">
            <div class="summary-title">VALOR TOTAL DA APOSTA:</div>
            <div class="summary-value">R$ ${totalApostado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>

        ${this.gerarSecoesResumo(apostasPorRodada)}
    </div>
</body>
</html>`;
  }

  private gerarLinhasRodada(rodada: any): string {
    return rodada.apostas.map((aposta: any, index: number) => {
      const cavalos = aposta.pareo.cavalos.map((cavalo: any) => cavalo.nome).join(' / ');
      const isUltimaLinha = index === rodada.apostas.length - 1;
      return `
        <tr>
          <td>${isUltimaLinha ? rodada.nomeRodada : ''}</td>
          <td>
            ${aposta.pareo.numero}- ${cavalos}
          </td>
          <td class="valor">R$ ${aposta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
          <td class="porcentagem">${aposta.porcentagemAposta}%</td>
          <td class="premio">R$ ${aposta.valorPremio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
          <td class="total-rodada">${isUltimaLinha ? `R$ ${aposta.valorOriginalPremio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}</td>
        </tr>
      `;
    }).join('');
  }


  private gerarSecoesResumo(apostasPorRodada: Map<string, any>): string {
    const apostasPorTipo = this.agruparApostasPorTipo(apostasPorRodada);

    let html = '';

    // Gera seção para cada tipo de rodada
    for (const [tipoRodada, apostas] of apostasPorTipo) {
      if (apostas.length > 0) {
        html += `
          <div class="summary-section">
              <div class="summary-title">${tipoRodada.toUpperCase()}</div>
              <table class="summary-table">
                  <tbody>
                      ${apostas.map(item => `
                        <tr>
                          <td>${item.chave}</td>
                          <td>R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      `).join('')}
                  </tbody>
              </table>
          </div>
        `;
      }
    }

    return html;
  }

  private agruparApostasPorTipo(apostasPorRodada: Map<string, any>): Map<string, Array<{ chave: string; valor: number }>> {
    const apostasPorTipo = new Map<string, Map<string, number>>();

    // Primeiro, agrupa por tipo e pareo, somando os valores
    for (const rodada of apostasPorRodada.values()) {
      const tipoRodada = rodada.tipoRodada.nome || 'TIPO DESCONHECIDO';
      
      if (!apostasPorTipo.has(tipoRodada)) {
        apostasPorTipo.set(tipoRodada, new Map());
      }

      for (const aposta of rodada.apostas) {
        const cavalos = aposta.pareo.cavalos.map((cavalo: any) => cavalo.nome).join(' / ');
        const chave = `${aposta.pareo.numero}- ${cavalos}`;
        
        const tipoMap = apostasPorTipo.get(tipoRodada)!;
        const valorAtual = tipoMap.get(chave) || 0;
        tipoMap.set(chave, valorAtual + aposta.valorPremio);
      }
    }

    // Converte para o formato final
    const resultado = new Map<string, Array<{ chave: string; valor: number }>>();
    
    for (const [tipoRodada, pareosMap] of apostasPorTipo) {
      const apostasAgrupadas: Array<{ chave: string; valor: number }> = [];
      
      for (const [chave, valor] of pareosMap) {
        apostasAgrupadas.push({ chave, valor });
      }
      
      resultado.set(tipoRodada, apostasAgrupadas);
    }

    return resultado;
  }
}

