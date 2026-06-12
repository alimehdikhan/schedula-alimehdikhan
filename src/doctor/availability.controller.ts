import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { AvailabilityService } from './availability.service';
import { CreateRecurringAvailabilityDto } from './dto/create-recurring-availability.dto';
import { UpdateRecurringAvailabilityDto } from './dto/update-recurring-availability.dto';
import { CreateCustomAvailabilityDto } from './dto/create-custom-availability.dto';
import type { RequestUser } from '../auth/jwt.strategy';

interface AuthenticatedRequest {
  user: RequestUser;
}

@Controller('doctor/availability')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.DOCTOR)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  createRecurring(@Request() req: AuthenticatedRequest, @Body() dto: CreateRecurringAvailabilityDto) {
    return this.availabilityService.createRecurring(req.user.id, dto);
  }

  @Get()
  getRecurring(@Request() req: AuthenticatedRequest) {
    return this.availabilityService.getRecurring(req.user.id);
  }

  @Patch(':id')
  updateRecurring(
    @Request() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRecurringAvailabilityDto
  ) {
    return this.availabilityService.updateRecurring(req.user.id, id, dto);
  }

  @Delete(':id')
  deleteRecurring(
    @Request() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string
  ) {
    return this.availabilityService.deleteRecurring(req.user.id, id);
  }

  @Post('override')
  createCustom(@Request() req: AuthenticatedRequest, @Body() dto: CreateCustomAvailabilityDto) {
    return this.availabilityService.createCustom(req.user.id, dto);
  }

  @Get('date')
  resolveDate(@Request() req: AuthenticatedRequest, @Query('date') date: string) {
    return this.availabilityService.resolveDate(req.user.id, date);
  }
}
