import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
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
    // Acepta *.edu y *.edu.[código-país de 2 letras] (ej: .edu.co, .edu.mx, .edu.ar)
    return /^[^\s@]+@[^\s@]+\.edu(\.[a-z]{2})?$/i.test(email.trim());
  }

  private createTransporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // ─── Registro ─────────────────────────────────────────────────────────────

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

    const normalizedEmail = dto.email.trim().toLowerCase();
    const password_hash = await bcrypt.hash(dto.password, 12);

    // En producción se requiere verificación por email.
    // En desarrollo se verifica automáticamente para no depender
    // de un enlace localhost que solo funciona en la máquina del dev.
    const isProduction = process.env.NODE_ENV === 'production';

    const is_verified = !isProduction;
    const verification_token = isProduction
      ? crypto.randomBytes(32).toString('hex')
      : null;

    await this.usersService.create({
      email: normalizedEmail,
      password_hash,
      verification_token,
      is_verified,
    });

    if (isProduction) {
      try {
        await this.sendVerificationEmail(normalizedEmail, verification_token!);
      } catch {
        // Si el envío falla en producción, auto-verificamos para no dejar al usuario bloqueado
        await this.usersService.update(
          (await this.usersService.findByEmail(normalizedEmail))!.id,
          { is_verified: true, verification_token: null },
        );
      }
      return {
        message: 'Registro exitoso. Revisa tu email para verificar tu cuenta.',
      };
    }

    return {
      message: 'Registro exitoso. Ya puedes iniciar sesión.',
    };
  }

  // ─── Verificación de email ─────────────────────────────────────────────────

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) throw new BadRequestException('Token inválido o expirado');

    await this.usersService.update(user.id, {
      is_verified: true,
      verification_token: null,
    });

    return {
      message: 'Email verificado correctamente. Ya puedes iniciar sesión.',
    };
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Credenciales incorrectas');

    if (!user.is_verified) {
      throw new UnauthorizedException(
        'Debes verificar tu email primero. Revisa tu bandeja de entrada.',
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Credenciales incorrectas');

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '24h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return { accessToken, refreshToken, userId: user.id };
  }

  // ─── Recuperar contraseña ──────────────────────────────────────────────────

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    // No revelar si el email existe o no (seguridad)
    if (!user) {
      return {
        message:
          'Si el correo existe en nuestro sistema, recibirás un enlace para recuperar tu contraseña.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora

    await this.usersService.update(user.id, {
      reset_password_token: resetToken,
      reset_password_expires: expires,
    });

    await this.sendPasswordResetEmail(user.email, resetToken);

    return {
      message:
        'Si el correo existe en nuestro sistema, recibirás un enlace para recuperar tu contraseña.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(token);

    if (!user || !user.reset_password_expires) {
      throw new BadRequestException('Enlace inválido o expirado');
    }

    const expires = new Date(user.reset_password_expires);
    if (expires < new Date()) {
      throw new BadRequestException(
        'El enlace ha expirado. Solicita uno nuevo desde la app.',
      );
    }

    const password_hash = await bcrypt.hash(newPassword, 12);

    await this.usersService.update(user.id, {
      password_hash,
      reset_password_token: null,
      reset_password_expires: null,
    });

    return {
      message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.',
    };
  }

  // ─── Emails privados ──────────────────────────────────────────────────────

  /** URL pública del backend. Funciona en dev y producción automáticamente. */
  private get backendUrl(): string {
    return (process.env.BACKEND_URL ?? '').replace(/\/$/, '') || 'http://localhost:3000';
  }

  private async sendVerificationEmail(email: string, token: string) {
    const verifyUrl = `${this.backendUrl}/auth/verify?token=${encodeURIComponent(token)}`;
    const transporter = this.createTransporter();

    await transporter.sendMail({
      from: '"ShareCampus" <noreply@sharecampus.app>',
      to: email,
      subject: 'Verifica tu cuenta en ShareCampus',
      html: this.emailTemplate(
        'Verifica tu cuenta',
        'Haz clic en el botón para activar tu cuenta en ShareCampus.',
        'Verificar cuenta',
        verifyUrl,
        'Este enlace caduca en 24 horas.',
      ),
    });
  }

  private async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${this.backendUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;
    const transporter = this.createTransporter();

    await transporter.sendMail({
      from: '"ShareCampus" <noreply@sharecampus.app>',
      to: email,
      subject: 'Recupera tu contraseña en ShareCampus',
      html: this.emailTemplate(
        'Recuperar contraseña',
        'Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para crear una nueva.',
        'Restablecer contraseña',
        resetUrl,
        'Este enlace caduca en 1 hora. Si no solicitaste esto, ignora este mensaje.',
      ),
    });
  }

  private emailTemplate(
    title: string,
    body: string,
    btnText: string,
    btnUrl: string,
    footer: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F5FF;font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5FF;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,.12)">
        <tr><td style="background:#7C3AED;padding:32px;text-align:center">
          <div style="width:60px;height:60px;background:rgba(255,255,255,.2);border-radius:14px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:#fff;line-height:60px">SC</div>
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800">ShareCampus</h1>
        </td></tr>
        <tr><td style="padding:32px">
          <h2 style="margin:0 0 12px;color:#1E1B4B;font-size:20px;font-weight:800">${title}</h2>
          <p style="margin:0 0 28px;color:#6B6690;font-size:15px;line-height:1.6">${body}</p>
          <a href="${btnUrl}"
             style="display:block;background:#7C3AED;color:#fff;text-align:center;padding:16px;border-radius:12px;text-decoration:none;font-size:15px;font-weight:700;margin-bottom:24px">
            ${btnText}
          </a>
          <p style="margin:0;color:#9CA3AF;font-size:12px;line-height:1.6">${footer}</p>
          <hr style="border:none;border-top:1px solid #EDE9FE;margin:24px 0">
          <p style="margin:0;color:#C4B5FD;font-size:11px;text-align:center">ShareCampus &middot; Plataforma universitaria de intercambio</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}
