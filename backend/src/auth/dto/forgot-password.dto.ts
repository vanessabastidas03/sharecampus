import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'usuario@universidad.edu.co' })
  @IsEmail({}, { message: 'Debes ingresar un correo electrónico válido' })
  email: string;
}
