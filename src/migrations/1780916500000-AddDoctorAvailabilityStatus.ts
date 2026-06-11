import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDoctorAvailabilityStatus1780916500000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('doctor_profiles', 'is_available');
    if (!hasColumn) {
      await queryRunner.addColumn(
        'doctor_profiles',
        new TableColumn({
          name: 'is_available',
          type: 'boolean',
          default: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('doctor_profiles', 'is_available');
  }
}
