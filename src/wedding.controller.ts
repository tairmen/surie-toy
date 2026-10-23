import { Body, Controller, Delete, Get, Headers, Param, ParseIntPipe, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { WeddingService } from './wedding.service';
import { isAdmin, requireAdmin } from './admin-auth';
const QRCode = require('qrcode');
@Controller('api')
export class WeddingController {
  constructor(private wedding: WeddingService) {}
  @Get('wishes') wishes() { return this.wedding.publicList('wish'); }
  @Post('wishes') wish(@Body() body: any) { return this.wedding.wish(body); }
  @Get('photos') photos() { return this.wedding.publicList('photo'); }
  @Post('photos') upload(@Req() req: Request, @Headers('x-photo-author') author: string) {
    let decoded: string;
    try { decoded = decodeURIComponent(author || ''); } catch { decoded = ''; }
    return this.wedding.photo(req.body, decoded);
  }
  @Get('photos/:id/image') async image(@Param('id', ParseIntPipe) id: number, @Headers('x-admin-key') key: string, @Res() res: Response) {
    const image = await this.wedding.image(id, isAdmin(key));
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.type(image.mime).sendFile(image.path);
  }
  @Get('album-qr') async qr(@Res() res: Response) {
    const svg = await QRCode.toString(`${(process.env.WEDDING_PUBLIC_URL || 'http://157.230.121.197').replace(/\/$/, '')}/#album`, { type: 'svg', margin: 2, color: { dark: '#5f2035', light: '#fffdf9' } });
    res.type('image/svg+xml').send(svg);
  }
  @Get('admin/entries') entries(@Headers('x-admin-key') key: string) { requireAdmin(key); return this.wedding.all(); }
  @Post('admin/entries/:id/approve') approve(@Param('id', ParseIntPipe) id: number, @Headers('x-admin-key') key: string) { requireAdmin(key); return this.wedding.approve(id); }
  @Delete('admin/entries/:id') remove(@Param('id', ParseIntPipe) id: number, @Headers('x-admin-key') key: string) { requireAdmin(key); return this.wedding.remove(id); }
}
