import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { UserDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() userDto: UserDto) {
    return this.authService.signup(userDto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  signin(@Body() userDto: UserDto) {
    return this.authService.signin(userDto);
  }
}
