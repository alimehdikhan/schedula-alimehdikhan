import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBookingConstraints1781400000000 implements MigrationInterface {
    name = 'AddBookingConstraints1781400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the old index
        await queryRunner.query(`DROP INDEX "public"."IDX_appointments_doctor_date"`);
        
        // Create the new more efficient index including status
        await queryRunner.query(`CREATE INDEX "IDX_appointments_doctor_date_status" ON "appointments" ("doctor_id", "date", "status")`);
        
        // Create the partial unique index to prevent double bookings
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_unique_booking" ON "appointments" ("doctor_id", "date", "start_time") WHERE status = 'BOOKED'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_unique_booking"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_appointments_doctor_date_status"`);
        await queryRunner.query(`CREATE INDEX "IDX_appointments_doctor_date" ON "appointments" ("doctor_id", "date")`);
    }
}
