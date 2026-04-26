import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  createChat(@Request() req, @Body() body: { item_id: string; receiver_id: string }) {
    return this.chatsService.createChat(req.user.sub, body.item_id, body.receiver_id);
  }

  @Post(':id/messages')
  sendMessage(@Request() req, @Param('id') chatId: string, @Body() body: { message: string }) {
    return this.chatsService.sendMessage(req.user.sub, chatId, body.message);
  }

  @Post(':id/respond')
  respondToRequest(@Request() req, @Param('id') chatId: string, @Body() body: { action: 'accept' | 'reject' }) {
    return this.chatsService.respondToRequest(req.user.sub, chatId, body.action);
  }

  @Post(':id/confirmation-code')
  generateCode(@Request() req, @Param('id') chatId: string) {
    return this.chatsService.generateConfirmationCode(req.user.sub, chatId);
  }

  @Post(':id/confirm')
  confirmDelivery(@Request() req, @Param('id') chatId: string, @Body() body: { code: string }) {
    return this.chatsService.confirmDelivery(req.user.sub, chatId, body.code);
  }

  @Post(':id/block')
  blockChat(@Request() req, @Param('id') chatId: string) {
    return this.chatsService.blockChat(req.user.sub, chatId);
  }

  @Get()
  getUserChats(@Request() req) {
    return this.chatsService.getUserChats(req.user.sub);
  }

  @Get(':id/messages')
  getMessages(@Request() req, @Param('id') chatId: string) {
    return this.chatsService.getMessages(req.user.sub, chatId);
  }
}