import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRodadaCasa1762033982951 implements MigrationInterface {
    name = 'CreateRodadaCasa1762033982951'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "rodadas_casa" ("id" SERIAL NOT NULL, "campeonatoId" integer NOT NULL, "rodada" character varying NOT NULL, "valorCasa" numeric(10,2) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fea4ec502be4b8aa4d715ef3bab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "rodadas_casa" ADD CONSTRAINT "FK_23d9b01a5d504fbb1b2eee8fb79" FOREIGN KEY ("campeonatoId") REFERENCES "campeonatos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "rodadas_casa" DROP CONSTRAINT "FK_23d9b01a5d504fbb1b2eee8fb79"`);
        await queryRunner.query(`DROP TABLE "rodadas_casa"`);
    }

}
