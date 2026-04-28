import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@universidad.edu.co' })
  @IsEmail({}, { message: 'Debes ingresar un correo electrónico válido' })
  email: string;

  @ApiProperty({ example: 'miContrasena123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
