import { Controller, Post, Body, Delete, Param, UseGuards, Request, ForbiddenException, Response } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/create-auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') pass: string,
    @Response() res: any,
  ) {
    const { access_token, user } = await this.authService.login(email, pass);

    res.cookie('nexu-token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    return res.json({ user, access_token });
  }

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Response() res: any,
  ) {
    const { access_token, user } = await this.authService.register(registerDto);

    res.cookie('nexu-token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    return res.json({ user, access_token });
  }

  @Post('logout')
  async logout(@Response() res: any) {
    res.clearCookie('nexu-token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    return res.json({ message: 'Logged out successfully' });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Request() req: any) {
    if (req.user.userId !== id) {
      throw new ForbiddenException('You can only delete your own account');
    }
    return this.authService.remove(id);
  }
}
