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
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { DoctorService } from './doctor.service';
import type { RequestUser } from '../auth/jwt.strategy';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';

interface AuthenticatedRequest {
  user: RequestUser;
}

@Controller('doctor')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.DOCTOR)
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post('profile')
  createProfile(
    @Request() request: AuthenticatedRequest,
    @Body() dto: CreateDoctorProfileDto,
  ) {
    return this.doctorService.createProfile(request.user.id, dto);
  }

  @Get('profile')
  getProfile(@Request() request: AuthenticatedRequest) {
    return this.doctorService.getProfile(request.user.id);
  }

  @Patch('profile')
  updateProfile(
    @Request() request: AuthenticatedRequest,
    @Body() dto: UpdateDoctorProfileDto,
  ) {
    return this.doctorService.updateProfile(request.user.id, dto);
  }
}
