import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreatePatientProfileDto } from './dto/create-patient-profile.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';
import { PatientService } from './patient.service';
import type { RequestUser } from '../auth/jwt.strategy';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';

interface AuthenticatedRequest {
  user: RequestUser;
}

@Controller('patient')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.PATIENT)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post('profile')
  createProfile(
    @Request() request: AuthenticatedRequest,
    @Body() dto: CreatePatientProfileDto,
  ) {
    return this.patientService.createProfile(request.user.id, dto);
  }

  @Get('profile')
  getProfile(@Request() request: AuthenticatedRequest) {
    return this.patientService.getProfile(request.user.id);
  }

  @Patch('profile')
  updateProfile(
    @Request() request: AuthenticatedRequest,
    @Body() dto: UpdatePatientProfileDto,
  ) {
    return this.patientService.updateProfile(request.user.id, dto);
  }
}
