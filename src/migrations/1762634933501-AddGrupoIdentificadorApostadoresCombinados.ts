import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGrupoIdentificadorApostadoresCombinados1762634933501 implements MigrationInterface {
    name = 'AddGrupoIdentificadorApostadoresCombinados1762634933501'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_a4e4457c20652c6748387ccaff"`);
        await queryRunner.query(`ALTER TABLE "apostadores_combinados" ADD "grupo_identificador" character varying(100)`);
        await queryRunner.query(`
            UPDATE "apostadores_combinados"
            SET "grupo_identificador" = LOWER(TRIM("nomeApostador"))
            WHERE "grupo_identificador" IS NULL
        `);
        await queryRunner.query(`ALTER TABLE "apostadores_combinados" ALTER COLUMN "grupo_identificador" SET NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1db71d73cb501ee293ee968c53" ON "apostadores_combinados" ("campeonatoId", "grupo_identificador", "nomeApostador") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_1db71d73cb501ee293ee968c53"`);
        await queryRunner.query(`ALTER TABLE "apostadores_combinados" DROP COLUMN "grupo_identificador"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a4e4457c20652c6748387ccaff" ON "apostadores_combinados" ("campeonatoId", "nomeApostador") `);
    }

}
