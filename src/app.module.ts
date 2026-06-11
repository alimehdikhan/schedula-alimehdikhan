import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CreateUsersAndProfiles1780916400000 } from './migrations/1780916400000-CreateUsersAndProfiles';
import { AddDoctorAvailabilityStatus1780916500000 } from './migrations/1780916500000-AddDoctorAvailabilityStatus';
import { DoctorModule } from './doctor/doctor.module';
import { PatientModule } from './patient/patient.module';

const databasePort = Number.parseInt(process.env.DB_PORT ?? '5432', 10);
const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...(process.env.DATABASE_URL
        ? { url: process.env.DATABASE_URL }
        : {
            host: process.env.DB_HOST ?? 'localhost',
            port: databasePort,
            username: process.env.DB_USERNAME ?? 'postgres',
            password: process.env.DB_PASSWORD ?? 'postgres',
            database: process.env.DB_NAME ?? 'schedula',
          }),
      autoLoadEntities: true,
      synchronize: false,
      migrations: [CreateUsersAndProfiles1780916400000, AddDoctorAvailabilityStatus1780916500000],
      migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    }),
    AuthModule,
    DoctorModule,
    PatientModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
