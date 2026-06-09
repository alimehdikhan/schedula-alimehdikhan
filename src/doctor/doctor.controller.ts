import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { QueryDoctorsDto } from './dto/query-doctors.dto';
import { DoctorService } from './doctor.service';
import type { RequestUser } from '../auth/jwt.strategy';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../users/user.entity';

interface AuthenticatedRequest {
  user: RequestUser;
}

// ─── Public Discovery Routes (no auth required) ───────────────────────────────
@Controller('doctors')
export class DoctorDiscoveryController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get()
  findAll(@Query() query: QueryDoctorsDto) {
    return this.doctorService.findAll(query);
  }

  @Get(':id')
  findOne(
    @Param(
      'id',
      new ParseIntPipe({
        exceptionFactory: () =>
          new BadRequestException('Doctor ID must be a valid integer'),
      }),
    )
    id: number,
  ) {
    return this.doctorService.findById(id);
  }
}

// ─── Protected Doctor-Only Routes ─────────────────────────────────────────────
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
