import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly authService: AuthService) {}

  // Endpoints will be implemented in the next session:
  // POST /auth/otp/request — send OTP via Twilio
  // POST /auth/otp/verify  — exchange OTP for JWT
  // POST /auth/refresh     — rotate refresh token
  // POST /auth/logout      — invalidate refresh token
  // GET  /auth/me          — current user profile
}
