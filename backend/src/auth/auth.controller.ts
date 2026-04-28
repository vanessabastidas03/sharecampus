import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Header,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Registro ──────────────────────────────────────────────────────────────

  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  // ─── Verificar email ───────────────────────────────────────────────────────

  @Get('verify')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @ApiOperation({ summary: 'Verificar email con token (devuelve página HTML)' })
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
    if (!token) {
      return res.send(this.verifyHtml(false, 'El enlace no contiene un token válido.'));
    }
    try {
      await this.authService.verifyEmail(token);
      return res.send(this.verifyHtml(true));
    } catch (e: any) {
      return res.send(this.verifyHtml(false, e?.message ?? 'Token inválido o expirado.'));
    }
  }

  private verifyHtml(success: boolean, errorMsg?: string): string {
    if (success) {
      return `<!DOCTYPE html><html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ShareCampus – Cuenta verificada</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{min-height:100vh;background:linear-gradient(135deg,#7C3AED,#5B21B6);display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif}
.card{background:#fff;border-radius:24px;padding:40px 32px;max-width:420px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.2)}
.icon{width:72px;height:72px;border-radius:50%;background:#D1FAE5;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:32px}
h1{font-size:22px;font-weight:800;color:#1E1B4B;margin-bottom:10px}
p{font-size:14px;color:#6B7280;line-height:1.6;margin-bottom:20px}
.timer{font-size:13px;color:#9CA3AF;margin-bottom:16px}
.btn{display:inline-block;background:#7C3AED;color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-size:15px;font-weight:700;box-shadow:0 8px 20px rgba(124,58,237,.4)}
</style>
</head>
<body>
<div class="card">
  <div class="icon">✓</div>
  <h1>Cuenta verificada!</h1>
  <p>Tu correo fue confirmado exitosamente.<br>Ya puedes iniciar sesion en ShareCampus.</p>
  <p class="timer" id="countdown">Abriendo la app en <strong>3</strong>s...</p>
  <a class="btn" href="sharecampus://login" id="open-btn">Abrir ShareCampus →</a>
</div>
<script>
  var secs = 3;
  var el = document.querySelector('#countdown strong');
  var t = setInterval(function(){
    secs--;
    if(el) el.textContent = secs;
    if(secs <= 0){
      clearInterval(t);
      document.getElementById('countdown').style.display='none';
      window.location.href = 'sharecampus://login';
    }
  }, 1000);
  // Intento inmediato por si el navegador soporta el scheme
  setTimeout(function(){ window.location.href = 'sharecampus://login'; }, 300);
</script>
</body></html>`;
    }
    return `<!DOCTYPE html><html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ShareCampus – Error de verificación</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{min-height:100vh;background:linear-gradient(135deg,#7C3AED,#5B21B6);display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif}
.card{background:#fff;border-radius:24px;padding:40px 32px;max-width:420px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.2);border-top:5px solid #F43F5E}
.icon{width:72px;height:72px;border-radius:50%;background:#FFE4E6;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:32px}
h1{font-size:22px;font-weight:800;color:#1E1B4B;margin-bottom:10px}
p{font-size:14px;color:#6B7280;line-height:1.6;margin-bottom:20px}
.divider{border:none;border-top:1px solid #EDE9FE;margin:20px 0}
label{display:block;font-size:13px;font-weight:700;color:#4B5563;margin-bottom:6px;text-align:left}
input{width:100%;padding:13px 16px;border:2px solid #EDE9FE;border-radius:12px;font-size:15px;color:#1E1B4B;background:#F7F5FF;outline:none;margin-bottom:14px}
input:focus{border-color:#7C3AED}
button{width:100%;padding:14px;background:#7C3AED;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;margin-top:4px}
button:disabled{opacity:.6;cursor:not-allowed}
.success-msg{background:#D1FAE5;border-radius:10px;padding:12px;font-size:13px;color:#065F46;font-weight:600;margin-top:12px}
.error-msg{background:#FFE4E6;border-radius:10px;padding:12px;font-size:13px;color:#BE123C;font-weight:600;margin-top:12px}
</style></head>
<body><div class="card">
<div class="icon">✕</div>
<h1>Enlace inválido</h1>
<p>${errorMsg ?? 'Este enlace ya fue usado o expiró.'}</p>
<hr class="divider">
<p style="font-weight:700;color:#1E1B4B;margin-bottom:16px">¿Deseas recibir un nuevo enlace?</p>
<label for="resend-email">Tu correo institucional</label>
<input type="email" id="resend-email" placeholder="correo@universidad.edu.co" autocomplete="email">
<button id="resend-btn" onclick="resend()">Reenviar enlace de verificación</button>
<div id="resend-result"></div>
</div>
<script>
async function resend(){
  const email=document.getElementById('resend-email').value.trim();
  const btn=document.getElementById('resend-btn');
  const result=document.getElementById('resend-result');
  if(!email){result.innerHTML='<div class="error-msg">Ingresa tu correo.</div>';return;}
  btn.disabled=true;btn.textContent='Enviando...';result.innerHTML='';
  try{
    const r=await fetch('/auth/resend-verification',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
    const d=await r.json();
    result.innerHTML='<div class="success-msg">'+(d.message||'Revisa tu bandeja de entrada.')+'</div>';
  }catch(e){
    result.innerHTML='<div class="error-msg">Error de conexión. Intenta desde la app.</div>';
  }finally{btn.disabled=false;btn.textContent='Reenviar enlace de verificación';}
}
</script>
</body></html>`;
  }

  // ─── Reenviar verificación ─────────────────────────────────────────────────

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reenviar email de verificación' })
  resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerification(body.email);
  }

  // ─── Recuperar contraseña: solicitar enlace ────────────────────────────────

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar enlace de recuperación de contraseña' })
  @ApiResponse({
    status: 200,
    description: 'Enlace enviado (si el email existe)',
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  // ─── Recuperar contraseña: formulario HTML (enlace del email) ─────────────

  @Get('reset-password')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @ApiOperation({ summary: 'Página HTML para restablecer contraseña' })
  resetPasswordPage(@Query('token') token: string, @Res() res: Response) {
    const hasToken = !!token;
    const html = this.buildResetPage(token, hasToken);
    res.send(html);
  }

  // ─── Recuperar contraseña: procesar formulario / API ──────────────────────

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña con token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  // ─── Página HTML para restablecer contraseña ──────────────────────────────

  private buildResetPage(token: string, hasToken: boolean): string {
    if (!hasToken) {
      return this.htmlWrapper(
        'Enlace inválido',
        `<div class="card error-card">
          <div class="icon-circle">!</div>
          <h2>Enlace inválido</h2>
          <p>Este enlace no es válido. Por favor solicita un nuevo enlace desde la app ShareCampus.</p>
        </div>`,
      );
    }

    return this.htmlWrapper(
      'Nueva contraseña',
      `<div class="card">
        <div class="logo-badge">SC</div>
        <h1 class="brand">ShareCampus</h1>
        <h2>Nueva contraseña</h2>
        <p class="subtitle">Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.</p>

        <div id="form-section">
          <div class="input-group">
            <label>Nueva contraseña</label>
            <input type="password" id="password" placeholder="Minimo 6 caracteres" autocomplete="new-password">
          </div>
          <div class="input-group">
            <label>Confirmar contraseña</label>
            <input type="password" id="confirm" placeholder="Repite tu contraseña" autocomplete="new-password">
          </div>
          <div id="error-box" class="error-box" style="display:none"></div>
          <button id="submit-btn" onclick="submitReset()">Guardar nueva contraseña →</button>
        </div>

        <div id="success-section" style="display:none">
          <div class="success-icon">✓</div>
          <h3>Contrasena actualizada</h3>
          <p>Tu contraseña fue cambiada exitosamente. Ya puedes iniciar sesion en la app ShareCampus.</p>
        </div>
      </div>

      <script>
        async function submitReset() {
          const pass = document.getElementById('password').value;
          const conf = document.getElementById('confirm').value;
          const btn  = document.getElementById('submit-btn');
          const err  = document.getElementById('error-box');

          err.style.display = 'none';

          if (!pass || !conf) {
            showError('Completa ambos campos.');
            return;
          }
          if (pass.length < 6) {
            showError('La contraseña debe tener al menos 6 caracteres.');
            return;
          }
          if (pass !== conf) {
            showError('Las contraseñas no coinciden.');
            return;
          }

          btn.disabled = true;
          btn.textContent = 'Guardando...';

          try {
            const res = await fetch('/auth/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: '${token}', password: pass }),
            });
            const data = await res.json();
            if (!res.ok) {
              showError(data.message || 'Error al actualizar la contraseña.');
              btn.disabled = false;
              btn.textContent = 'Guardar nueva contraseña →';
              return;
            }
            document.getElementById('form-section').style.display = 'none';
            document.getElementById('success-section').style.display = 'block';
          } catch (e) {
            showError('Error de conexion. Intenta de nuevo.');
            btn.disabled = false;
            btn.textContent = 'Guardar nueva contraseña →';
          }
        }

        function showError(msg) {
          const el = document.getElementById('error-box');
          el.textContent = msg;
          el.style.display = 'block';
        }
      </script>`,
    );
  }

  private htmlWrapper(title: string, content: string): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>ShareCampus – ${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
      font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 24px;
      padding: 36px 28px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,.2);
      text-align: center;
    }
    .error-card { border-top: 5px solid #F43F5E; }
    .logo-badge {
      width: 64px; height: 64px; background: #EDE9FE;
      border-radius: 16px; margin: 0 auto 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 900; color: #7C3AED;
    }
    .brand { font-size: 22px; font-weight: 800; color: #7C3AED; margin-bottom: 20px; }
    h2 { font-size: 20px; font-weight: 800; color: #1E1B4B; margin-bottom: 8px; }
    h3 { font-size: 18px; font-weight: 800; color: #059669; margin-bottom: 8px; }
    .subtitle { font-size: 14px; color: #9CA3AF; margin-bottom: 24px; line-height: 1.5; }
    p { font-size: 14px; color: #9CA3AF; line-height: 1.6; }
    .input-group { text-align: left; margin-bottom: 14px; }
    label { display: block; font-size: 13px; font-weight: 700; color: #4B5563; margin-bottom: 6px; }
    input {
      width: 100%; padding: 13px 16px; border: 2px solid #EDE9FE;
      border-radius: 12px; font-size: 15px; color: #1E1B4B;
      background: #F7F5FF; outline: none; transition: border-color .2s;
    }
    input:focus { border-color: #7C3AED; background: #EDE9FE; }
    button {
      width: 100%; padding: 15px; background: #7C3AED; color: #fff;
      border: none; border-radius: 12px; font-size: 16px; font-weight: 800;
      cursor: pointer; margin-top: 8px; transition: opacity .2s, transform .1s;
      box-shadow: 0 8px 20px rgba(124,58,237,.4);
    }
    button:hover { opacity: .92; }
    button:active { transform: scale(.98); }
    button:disabled { opacity: .6; cursor: not-allowed; }
    .error-box {
      background: #FFE4E6; border-left: 4px solid #F43F5E;
      border-radius: 10px; padding: 12px; margin-bottom: 14px;
      text-align: left; font-size: 13px; color: #BE123C; font-weight: 600;
    }
    .icon-circle {
      width: 56px; height: 56px; border-radius: 50%;
      background: #FFE4E6; margin: 0 auto 16px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; font-weight: 900; color: #F43F5E;
    }
    .success-icon {
      width: 64px; height: 64px; border-radius: 50%;
      background: #D1FAE5; margin: 16px auto;
      display: flex; align-items: center; justify-content: center;
      font-size: 30px; color: #059669; font-weight: 800;
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
  }
}
