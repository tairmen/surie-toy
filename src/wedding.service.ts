import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GuestEntry } from './guest-entry.entity';
import { mkdir, writeFile, unlink, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
export function text(value: unknown, max: number, required = false): string {
  if (value !== undefined && typeof value !== 'string') throw new BadRequestException('Проверьте заполненные поля.');
  const result = (typeof value === 'string' ? value : '').trim();
  if ((required && !result) || result.length > max) throw new BadRequestException(`Заполните поле (до ${max} символов).`);
  return result;
}
@Injectable()
export class WeddingService {
  readonly directory = join(process.cwd(), 'data', 'wedding-uploads');
  constructor(@InjectRepository(GuestEntry) private entries: Repository<GuestEntry>) {}
  publicList(kind: string) {
    return this.entries.find({ where: { kind, approved: true }, select: ['id', 'author', 'message', 'createdAt', 'kind'], order: { createdAt: 'DESC' }, take: 100 });
  }
  async wish(body: any) {
    const author = text(body?.author, 80, true), message = text(body?.message, 1200, true);
    await this.entries.save(this.entries.create({ kind: 'wish', author, message }));
    return { message: 'Спасибо! Ваше пожелание отправлено молодожёнам и появится после подтверждения.' };
  }
  async photo(buffer: Buffer, authorValue: string) {
    const author = text(authorValue, 80, true);
    if (!Buffer.isBuffer(buffer) || buffer.length < 12 || buffer.length > 12 * 1024 * 1024) throw new BadRequestException('Выберите фото до 12 МБ.');
    let mime: string, ext: string;
    if (buffer.subarray(0, 3).equals(Buffer.from([255,216,255]))) { mime='image/jpeg'; ext='jpg'; }
    else if (buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) { mime='image/png'; ext='png'; }
    else if (buffer.toString('ascii',0,4)==='RIFF' && buffer.toString('ascii',8,12)==='WEBP') { mime='image/webp'; ext='webp'; }
    else throw new BadRequestException('Поддерживаются JPEG, PNG и WebP.');
    await mkdir(this.directory, { recursive: true });
    const existing = await readdir(this.directory);
    let bytes = 0;
    for (const file of existing) bytes += (await stat(join(this.directory, file))).size;
    if (bytes + buffer.length > 300 * 1024 * 1024) throw new BadRequestException('Альбом заполнен. Пожалуйста, передайте фото молодожёнам лично.');
    const filename = `${randomUUID()}.${ext}`;
    await writeFile(join(this.directory, filename), buffer, { flag: 'wx' });
    try { await this.entries.save(this.entries.create({ kind: 'photo', author, filename, mime })); }
    catch (error) { await unlink(join(this.directory, filename)); throw error; }
    return { message: 'Фото загружено! Оно появится в альбоме после подтверждения молодожёнами.' };
  }
  all() { return this.entries.find({ order: { createdAt: 'DESC' }, take: 500 }); }
  async image(id: number, admin: boolean) {
    const entry = await this.entries.findOneBy({ id, kind: 'photo' });
    if (!entry || (!entry.approved && !admin)) throw new NotFoundException();
    return { path: join(this.directory, entry.filename), mime: entry.mime };
  }
  async approve(id: number) {
    const result = await this.entries.update(id, { approved: true });
    if (!result.affected) throw new NotFoundException();
    return { ok: true };
  }
  async remove(id: number) {
    const entry = await this.entries.findOneBy({ id });
    if (!entry) throw new NotFoundException();
    await this.entries.delete(id);
    if (entry.filename) await unlink(join(this.directory, entry.filename)).catch(() => undefined);
    return { ok: true };
  }
}
