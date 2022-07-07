import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';

import { GetUser } from '../auth/decorator';
import { JwtGuard } from '../auth/guard';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  getProfile(@GetUser() user: User) {
    return user;
  }

  @Put()
  updateUser(@GetUser('id') userId: number, @Body() userDto: UpdateUserDto) {
    return this.userService.updateUser(userId, userDto);
  }
}
