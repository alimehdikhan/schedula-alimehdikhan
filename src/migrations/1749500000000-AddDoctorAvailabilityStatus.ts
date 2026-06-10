import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDoctorAvailabilityStatus1749500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'doctor_profiles',
      new TableColumn({
        name: 'is_available',
        type: 'boolean',
        default: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('doctor_profiles', 'is_available');
  }
}
