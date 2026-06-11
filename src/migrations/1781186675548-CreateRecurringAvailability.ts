import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRecurringAvailability1781186675548 implements MigrationInterface {
    name = 'CreateRecurringAvailability1781186675548'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patient_profiles" DROP CONSTRAINT "FK_patient_profiles_user_id"`);
        await queryRunner.query(`ALTER TABLE "doctor_profiles" DROP CONSTRAINT "FK_doctor_profiles_user_id"`);
        await queryRunner.query(`ALTER TABLE "patient_profiles" DROP CONSTRAINT "CHK_patient_profiles_age"`);
        await queryRunner.query(`ALTER TABLE "patient_profiles" DROP CONSTRAINT "CHK_patient_profiles_gender"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "CHK_users_role"`);
        await queryRunner.query(`ALTER TABLE "doctor_profiles" DROP CONSTRAINT "CHK_doctor_profiles_experience"`);
        await queryRunner.query(`ALTER TABLE "doctor_profiles" DROP CONSTRAINT "CHK_doctor_profiles_fee"`);
        await queryRunner.query(`CREATE TYPE "public"."recurring_availability_day_of_week_enum" AS ENUM('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN')`);
        await queryRunner.query(`CREATE TABLE "recurring_availability" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "doctor_id" integer NOT NULL, "day_of_week" "public"."recurring_availability_day_of_week_enum" NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2464dd095ba418858c1aa3f4e01" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "custom_availability" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "doctor_id" integer NOT NULL, "date" date NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e9b8fa5803ca3d6554a7ddf7045" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "patient_profiles" ADD CONSTRAINT "FK_e296010b9088277148d109ba75a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "doctor_profiles" ADD CONSTRAINT "FK_69995f9059305ab7a9c52cdb10e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_availability" ADD CONSTRAINT "FK_814ae095c0f609eb6774680a069" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "custom_availability" ADD CONSTRAINT "FK_01e3c636792e6aee17e99ebc531" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "custom_availability" DROP CONSTRAINT "FK_01e3c636792e6aee17e99ebc531"`);
        await queryRunner.query(`ALTER TABLE "recurring_availability" DROP CONSTRAINT "FK_814ae095c0f609eb6774680a069"`);
        await queryRunner.query(`ALTER TABLE "doctor_profiles" DROP CONSTRAINT "FK_69995f9059305ab7a9c52cdb10e"`);
        await queryRunner.query(`ALTER TABLE "patient_profiles" DROP CONSTRAINT "FK_e296010b9088277148d109ba75a"`);
        await queryRunner.query(`DROP TABLE "custom_availability"`);
        await queryRunner.query(`DROP TABLE "recurring_availability"`);
        await queryRunner.query(`DROP TYPE "public"."recurring_availability_day_of_week_enum"`);
        await queryRunner.query(`ALTER TABLE "doctor_profiles" ADD CONSTRAINT "CHK_doctor_profiles_fee" CHECK ((consultation_fee > (0)::numeric))`);
        await queryRunner.query(`ALTER TABLE "doctor_profiles" ADD CONSTRAINT "CHK_doctor_profiles_experience" CHECK ((experience > 0))`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "CHK_users_role" CHECK (((role)::text = ANY ((ARRAY['DOCTOR'::character varying, 'PATIENT'::character varying])::text[])))`);
        await queryRunner.query(`ALTER TABLE "patient_profiles" ADD CONSTRAINT "CHK_patient_profiles_gender" CHECK (((gender)::text = ANY ((ARRAY['MALE'::character varying, 'FEMALE'::character varying, 'OTHER'::character varying])::text[])))`);
        await queryRunner.query(`ALTER TABLE "patient_profiles" ADD CONSTRAINT "CHK_patient_profiles_age" CHECK ((age > 0))`);
        await queryRunner.query(`ALTER TABLE "doctor_profiles" ADD CONSTRAINT "FK_doctor_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "patient_profiles" ADD CONSTRAINT "FK_patient_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
