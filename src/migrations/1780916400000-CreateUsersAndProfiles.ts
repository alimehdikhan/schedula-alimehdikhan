import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersAndProfiles1780916400000 implements MigrationInterface {
  name = 'CreateUsersAndProfiles1780916400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" character varying(20) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "CHK_users_role" CHECK ("role" IN ('DOCTOR', 'PATIENT')),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "doctor_profiles" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "full_name" character varying(120) NOT NULL,
        "specialization" character varying(120) NOT NULL,
        "experience" integer NOT NULL,
        "qualification" character varying(160) NOT NULL,
        "consultation_fee" numeric(10,2) NOT NULL,
        "availability" text NOT NULL,
        "profile_details" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_doctor_profiles_user_id" UNIQUE ("user_id"),
        CONSTRAINT "CHK_doctor_profiles_experience" CHECK ("experience" > 0),
        CONSTRAINT "CHK_doctor_profiles_fee" CHECK ("consultation_fee" > 0),
        CONSTRAINT "PK_doctor_profiles_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "patient_profiles" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "full_name" character varying(120) NOT NULL,
        "age" integer NOT NULL,
        "gender" character varying(20) NOT NULL,
        "contact_details" text NOT NULL,
        "health_information" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_patient_profiles_user_id" UNIQUE ("user_id"),
        CONSTRAINT "CHK_patient_profiles_age" CHECK ("age" > 0),
        CONSTRAINT "CHK_patient_profiles_gender" CHECK ("gender" IN ('MALE', 'FEMALE', 'OTHER')),
        CONSTRAINT "PK_patient_profiles_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
      ADD CONSTRAINT "FK_doctor_profiles_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "patient_profiles"
      ADD CONSTRAINT "FK_patient_profiles_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "patient_profiles" DROP CONSTRAINT "FK_patient_profiles_user_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "doctor_profiles" DROP CONSTRAINT "FK_doctor_profiles_user_id"
    `);
    await queryRunner.query('DROP TABLE "patient_profiles"');
    await queryRunner.query('DROP TABLE "doctor_profiles"');
    await queryRunner.query('DROP TABLE "users"');
  }
}
