import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { raw } from 'express';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const buckets = new Map<string, { count: number; until: number }>();
  app.use((req, res, next) => {
    if (req.method !== 'POST' || !['/api/photos', '/api/wishes', '/api/confirm-attendance'].includes(req.path)) return next();
    const now = Date.now();
    for (const [key, value] of buckets) if (value.until < now) buckets.delete(key);
    // Nginx overwrites X-Real-IP; trust it only on loopback proxy connections.
    const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
    const ip = local ? (req.headers['x-real-ip'] || req.socket.remoteAddress) : req.socket.remoteAddress;
    const key = `${ip}:${req.path}`;
    const bucket = buckets.get(key) || { count: 0, until: now + 600000 };
    bucket.count++; buckets.set(key, bucket);
    if (bucket.count > 12) return res.status(429).json({ message: 'Слишком много отправок. Попробуйте через 10 минут.' });
    next();
  });
  app.use('/api/photos', raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '12mb' }));
  await app.listen(4000);
}
bootstrap();
