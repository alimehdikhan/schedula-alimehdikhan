import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAvailabilityIndexes1781187097825 implements MigrationInterface {
    name = 'AddAvailabilityIndexes1781187097825'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_87c7cd34866e343413475a2613" ON "recurring_availability"  ("doctor_id", "day_of_week") `);
        await queryRunner.query(`CREATE INDEX "IDX_5fced64b088094214bb71b2357" ON "custom_availability"  ("doctor_id", "date") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_5fced64b088094214bb71b2357"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_87c7cd34866e343413475a2613"`);
    }

}
