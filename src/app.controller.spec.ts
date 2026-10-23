import { AppService } from './app.service';
import { WeddingService } from './wedding.service';
import { requireAdmin } from './admin-auth';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
describe('Wedding guest data', () => {
  let repository: any;
  beforeEach(() => { repository = { save: jest.fn(async value => ({id:1,...value})), create: jest.fn(value => value), find: jest.fn(async () => []), findOneBy: jest.fn(async () => null), update: jest.fn(async () => ({affected:1})) }; });
  it('normalizes an RSVP and discards arbitrary fields', async () => {
    const service=new AppService(repository);
    await service.create({name:'  Гость  ',surname:' Имя ',details:{events:'both',guests:2,attending:true,song:'  Песня  '},guess:' Счастья '});
    expect(repository.save).toHaveBeenCalledWith({name:'Гость',surname:'Имя',guess:'Счастья',details:{events:'both',guests:2,attending:true,song:'Песня',dietary:''}});
  });
  it('rejects malformed attendance and empty names before persistence', async () => {
    const service=new AppService(repository);
    await expect(service.create({name:' '})).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create({name:'Имя',details:{events:'invalid',guests:99,attending:true}})).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });
  it('keeps wishes pending even if a client requests publication', async () => {
    await new WeddingService(repository).wish({author:'Гость',message:'Счастья!',approved:true});
    expect(repository.save).toHaveBeenCalledWith({kind:'wish',author:'Гость',message:'Счастья!'});
  });
  it('returns only approved public fields', async () => {
    await new WeddingService(repository).publicList('photo');
    expect(repository.find).toHaveBeenCalledWith(expect.objectContaining({where:{kind:'photo',approved:true},select:['id','author','message','createdAt','kind']}));
  });
  it('hides pending photo files from guests', async () => {
    repository.findOneBy.mockResolvedValue({id:1,kind:'photo',approved:false,filename:'test.jpg',mime:'image/jpeg'});
    const service=new WeddingService(repository);
    await expect(service.image(1,false)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.image(1,true)).resolves.toEqual(expect.objectContaining({mime:'image/jpeg'}));
  });
  it('rejects fake image uploads before writing files', async () => {
    await expect(new WeddingService(repository).photo(Buffer.from('not an image file at all'),'Guest')).rejects.toBeInstanceOf(BadRequestException);
  });
  it('requires an exact configured admin secret', () => {
    process.env.WEDDING_ADMIN_KEY='test-secret';
    expect(()=>requireAdmin('wrong')).toThrow(UnauthorizedException);
    expect(()=>requireAdmin(undefined)).toThrow(UnauthorizedException);
    expect(()=>requireAdmin('test-secret')).not.toThrow();
    delete process.env.WEDDING_ADMIN_KEY;
  });
});
