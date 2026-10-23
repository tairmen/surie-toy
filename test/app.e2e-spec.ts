import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppController } from '../src/app.controller';
import { WeddingController } from '../src/wedding.controller';
import { AppService } from '../src/app.service';
import { WeddingService } from '../src/wedding.service';
describe('Wedding HTTP API', () => {
  let app: INestApplication;
  const service={ create: jest.fn(async body => ({id:1,...body})),findAll:jest.fn(async()=>[]),remove:jest.fn(async()=>undefined) };
  const wedding={publicList:jest.fn(async()=>[]),wish:jest.fn(async()=>({message:'pending'})),all:jest.fn(async()=>[]),approve:jest.fn(async()=>({ok:true})),remove:jest.fn(async()=>({ok:true}))};
  beforeAll(async()=>{
    process.env.WEDDING_ADMIN_KEY='integration-test-key';
    const module=await Test.createTestingModule({controllers:[AppController,WeddingController],providers:[{provide:AppService,useValue:service},{provide:WeddingService,useValue:wedding}]}).compile();
    app=module.createNestApplication();await app.init();
  });
  afterAll(async()=>{await app.close();delete process.env.WEDDING_ADMIN_KEY;});
  it('serves the invitation',async()=>{await request(app.getHttpServer()).get('/').expect(200).expect(/Ильяс/);});
  it('keeps guest lists and moderation private',async()=>{
    await request(app.getHttpServer()).get('/api/attendees').expect(401);
    await request(app.getHttpServer()).get('/api/admin/entries').expect(401);
    await request(app.getHttpServer()).post('/api/admin/entries/1/approve').expect(401);
    await request(app.getHttpServer()).delete('/api/attendees/1').expect(401);
    await request(app.getHttpServer()).get('/api/attendees').set('X-Admin-Key','integration-test-key').expect(200);
  });
  it('offers public approved content and an SVG album QR',async()=>{
    await request(app.getHttpServer()).get('/api/wishes').expect(200,[]);
    await request(app.getHttpServer()).get('/api/photos').expect(200,[]);
    await request(app.getHttpServer()).get('/api/album-qr').expect(200).expect('Content-Type',/svg/);
  });
});
