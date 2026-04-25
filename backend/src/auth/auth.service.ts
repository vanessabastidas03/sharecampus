import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private isInstitutionalEmail(email: string): boolean {
    const domains = ['.edu', '.edu.co', 'udenar.edu.co'];
    return domains.some(domain => email.endsWith(domain));
  }

  async register(dto: RegisterDto) {
    if (!this.isInstitutionalEmail(dto.email)) {
      throw new BadRequestException(
        'Solo se permiten emails institucionales (.edu, .edu.co)',
      );
    }

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException(
        'Este correo ya está registrado. ¿Deseas iniciar sesión?',
      );
    }

    const password_hash = await bcrypt.hash(dto.password, 12);
    const verification_token = crypto.randomBytes(32).toString('hex');

    await this.usersService.create({
      email: dto.email,
      password_hash,
      verification_token,
      is_verified: false,
    });

    await this.sendVerificationEmail(dto.email, verification_token);

    return { message: 'Registro exitoso. Revisa tu email para verificar tu cuenta.' };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) throw new BadRequestException('Token inválido o expirado');

    await this.usersService.update(user.id, {
      is_verified: true,
      verification_token: null,
    });

    return { message: 'Email verificado correctamente. Ya puedes iniciar sesión.' };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Credenciales incorrectas');
    if (!user.is_verified) throw new UnauthorizedException('Debes verificar tu email primero');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Credenciales incorrectas');

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '24h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return { accessToken, refreshToken, userId: user.id };
  }

  private async sendVerificationEmail(email: string, token: string) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const verifyUrl = `${process.env.APP_URL}/auth/verify?token=${token}`;

    await transporter.sendMail({
      from: '"ShareCampus" <noreply@sharecampus.app>',
      to: email,
      subject: 'Verifica tu cuenta en ShareCampus',
      html: `<p>Hola, haz clic en el enlace para activar tu cuenta:</p>
             <a href="${verifyUrl}">${verifyUrl}</a>
             <p>Este enlace caduca en 24 horas.</p>`,
    });
  }
}