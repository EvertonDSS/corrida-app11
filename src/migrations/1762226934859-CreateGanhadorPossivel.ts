import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGanhadorPossivel1762226934859 implements MigrationInterface {
    name = 'CreateGanhadorPossivel1762226934859'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "ganhadores_possiveis" ("id" SERIAL NOT NULL, "campeonatoId" integer NOT NULL, "tipoRodadaId" integer NOT NULL, "cavaloId" integer NOT NULL, "isVencedor" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d541448ef24d571d3dece64847d" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "ganhadores_possiveis"`);
    }

}
