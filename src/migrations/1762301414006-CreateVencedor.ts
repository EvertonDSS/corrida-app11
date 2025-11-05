import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVencedor1762301414006 implements MigrationInterface {
    name = 'CreateVencedor1762301414006'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "vencedores" ("id" SERIAL NOT NULL, "campeonatoId" integer NOT NULL, "cavaloId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ec343e940e4bc55a3638a677e02" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "vencedores" ADD CONSTRAINT "FK_9e1294478c80e084c2b8433176c" FOREIGN KEY ("campeonatoId") REFERENCES "campeonatos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vencedores" ADD CONSTRAINT "FK_f133dd5aac67a2a57e7b9db00b5" FOREIGN KEY ("cavaloId") REFERENCES "cavalos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vencedores" DROP CONSTRAINT "FK_f133dd5aac67a2a57e7b9db00b5"`);
        await queryRunner.query(`ALTER TABLE "vencedores" DROP CONSTRAINT "FK_9e1294478c80e084c2b8433176c"`);
        await queryRunner.query(`DROP TABLE "vencedores"`);
    }

}
