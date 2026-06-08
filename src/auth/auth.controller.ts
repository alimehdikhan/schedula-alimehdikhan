import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import type { RequestUser } from './jwt.strategy';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../users/user.entity';

interface AuthenticatedRequest {
  user: RequestUser;
}

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/signup')
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('auth/login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('doctor/profile')
  @Roles(UserRole.DOCTOR)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  getDoctorProfile(@Request() request: AuthenticatedRequest) {
    return {
      message: 'Doctor profile accessed successfully',
      user: request.user,
    };
  }

  @Get('patient/profile')
  @Roles(UserRole.PATIENT)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  getPatientProfile(@Request() request: AuthenticatedRequest) {
    return {
      message: 'Patient profile accessed successfully',
      user: request.user,
    };
  }
}
