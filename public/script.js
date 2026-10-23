'use strict';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const safeSession = { get: key => { try { return sessionStorage.getItem(key); } catch { return null; } }, set: (key,value) => { try { sessionStorage.setItem(key,value); } catch {} } };
let toastTimer;
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 4500); }
async function request(path, options = {}) {
  let response;
  try { response = await fetch(path, options); } catch { throw new Error('Не удалось связаться с сервером. Проверьте интернет и попробуйте ещё раз.'); }
  let data; try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) throw new Error(typeof data.message === 'string' ? data.message : response.status === 413 ? 'Фото слишком большое. Выберите файл до 12 МБ.' : 'Не удалось отправить. Пожалуйста, попробуйте ещё раз.');
  return data;
}
function json(body) { return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }; }
const envelope = $('#envelope');
function openInvitation() {
  safeSession.set('invitation-opened', 'yes'); envelope.classList.add('leaving');
  setTimeout(() => { envelope.close(); document.body.classList.remove('dialog-open'); $('#home h1').tabIndex = -1; $('#home h1').focus({ preventScroll: true }); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450);
}
if (!safeSession.get('invitation-opened') && !location.hash && typeof envelope.showModal === 'function') { envelope.showModal(); document.body.classList.add('dialog-open'); }
$('#open-invitation').addEventListener('click', openInvitation);
envelope.addEventListener('cancel', event => { event.preventDefault(); openInvitation(); });
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: .07 });
  $$('.reveal').forEach(element => observer.observe(element)); document.documentElement.classList.add('js');
}
function updateCountdown(now = Date.now()) {
  const nikah = new Date('2026-11-05T12:00:00+03:00').getTime(), wedding = new Date('2026-11-14T18:00:00+03:00').getTime();
  const target = now < nikah ? nikah : wedding;
  $('#countdown-label').textContent = now < nikah ? 'До нашего никяха осталось' : now < wedding ? 'До нашей свадьбы осталось' : 'Наша новая глава уже началась';
  if (now >= wedding) $('#countdown-note').textContent = 'Спасибо, что разделили с нами эти дни ♡';
  let remaining = Math.max(0, Math.floor((target - now) / 1000));
  for (const [id, unit] of [['days',86400],['hours',3600],['minutes',60],['seconds',1]]) { const value = Math.floor(remaining / unit); remaining %= unit; document.getElementById(id).textContent = String(value).padStart(2,'0'); }
}
updateCountdown(); setInterval(updateCountdown, 1000);
const events = {
  nikah: { title: 'Никях Ильяса и Султание', start: '20261105T090000Z', location: 'Соборная мечеть, Республика Крым, Симферополь, Ялтинская улица, 22', description: 'Начало в 12:00 по местному времени (UTC+3).' },
  wedding: { title: 'Свадьба Ильяса и Султание', start: '20261114T150000Z', location: 'Банкетный зал Matisse, Республика Крым, Симферополь, улица 60 лет Октября, 33', description: 'Начало в 18:00 по местному времени (UTC+3). Маршрут: https://maps.app.goo.gl/L7HzpWads15gdFsC6' }
};
const escapeICS = value => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
function foldICS(line) { let result = '', size = 0; for (const character of line) { const bytes = new TextEncoder().encode(character).length; if (size + bytes > 74) { result += '\r\n '; size = 1; } result += character; size += bytes; } return result; }
function calendar(key) {
  const event = events[key];
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Ilyas Sultanie//Wedding//RU','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${key}-2026@aydersurietoy.com`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART:${event.start}`,`SUMMARY:${escapeICS(event.title)}`,`LOCATION:${escapeICS(event.location)}`,`DESCRIPTION:${escapeICS(event.description)}`,'END:VEVENT','END:VCALENDAR'];
  const url = URL.createObjectURL(new Blob([lines.map(foldICS).join('\r\n')+'\r\n'], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = `${key}-2026.ics`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Откройте скачанный файл, чтобы добавить событие в календарь.');
}
$$('[data-calendar]').forEach(button => button.addEventListener('click', () => calendar(button.dataset.calendar)));
let photoIndex = 0, photoSet = [];
const couplePhotos = [{ src: 'ilyas-sultanie-hero.jpg', caption: 'Ильяс и Султание · Вместе' }, { src: 'ilyas-sultanie-2.jpg', caption: 'Наш танец' }, { src: 'ilyas-sultanie-3.jpg', caption: 'Наш счастливый момент' }];
const lightbox = $('#lightbox');
function renderPhoto() { const photo = photoSet[photoIndex]; $('#lightbox-image').src = photo.src; $('#lightbox-image').alt = photo.caption; $('#lightbox-caption').textContent = `${photoIndex+1} / ${photoSet.length} · ${photo.caption}`; }
function showPhoto(set, index) { photoSet = set; photoIndex = index; renderPhoto(); lightbox.showModal(); document.body.classList.add('dialog-open'); }
function changePhoto(delta) { photoIndex = (photoIndex + delta + photoSet.length) % photoSet.length; renderPhoto(); }
$$('[data-photo]').forEach(button => button.addEventListener('click', () => showPhoto(couplePhotos, Number(button.dataset.photo))));
$('.lightbox-close').addEventListener('click', () => lightbox.close());
$('#photo-prev').addEventListener('click', () => changePhoto(-1)); $('#photo-next').addEventListener('click', () => changePhoto(1));
lightbox.addEventListener('close', () => document.body.classList.remove('dialog-open'));
lightbox.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
lightbox.addEventListener('keydown', event => { if (event.key === 'ArrowLeft') changePhoto(-1); if (event.key === 'ArrowRight') changePhoto(1); });
let touchStart;
lightbox.addEventListener('touchstart', event => { touchStart = event.changedTouches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', event => { const delta = event.changedTouches[0].clientX - touchStart; if (Math.abs(delta) > 60) changePhoto(delta > 0 ? -1 : 1); }, { passive: true });
const questions = [
  { q: 'Где началась наша история?', options: ['На прогулке в парке','В самолёте','На концерте'], answer: 0, note: 'Одна прогулка и одно «привет» — так всё и началось.' },
  { q: 'Когда состоится наш никях?', options: ['14 ноября','5 ноября','5 декабря'], answer: 1, note: '5 ноября 2026 года, в 12:00.' },
  { q: 'Где мы будем отмечать свадьбу?', options: ['В парке','В банкетном зале «Matisse»','У моря'], answer: 1, note: 'Ждём вас в «Matisse» 14 ноября.' },
  { q: 'Во сколько начинается свадьба?', options: ['В 12:00','В 16:00','В 18:00'], answer: 2, note: '14 ноября в 18:00 — самое время для тёплого вечера.' },
  { q: 'В каком городе мы встретимся?', options: ['Симферополь','Ялта','Севастополь'], answer: 0, note: 'Оба события пройдут в Симферополе.' }
];
let quizStep = 0, score = 0;
function renderQuiz() {
  $('#quiz-feedback').textContent = ''; $('#quiz-next').hidden = true;
  if (quizStep === questions.length) { $('#quiz-progress').textContent = 'Квиз завершён'; $('#quiz-bar').style.width = '100%'; $('#quiz-question').textContent = `${score} из ${questions.length} — спасибо за игру!`; $('#quiz-options').replaceChildren(); $('#quiz-feedback').textContent = score === 5 ? 'Вы знаете нашу историю на отлично. До встречи на празднике ♡' : 'Теперь вы знаете нас ещё немного лучше. До встречи ♡'; $('#quiz-next').textContent = 'Сыграть ещё раз ↻'; $('#quiz-next').hidden = false; return; }
  const item = questions[quizStep]; $('#quiz-progress').textContent = `Вопрос ${quizStep+1} из ${questions.length}`; $('#quiz-bar').style.width = `${quizStep / questions.length * 100}%`; $('#quiz-question').textContent = item.q;
  $('#quiz-options').replaceChildren(...item.options.map((option,index) => { const button = document.createElement('button'); button.type = 'button'; button.textContent = option; button.addEventListener('click', () => { const buttons = [...$('#quiz-options').children]; buttons.forEach(b => { b.disabled = true; }); buttons[item.answer].classList.add('correct'); if (index === item.answer) score++; else button.classList.add('wrong'); $('#quiz-feedback').textContent = (index === item.answer ? 'Верно! ' : 'А вот и ответ: ') + item.note; $('#quiz-next').textContent = quizStep === questions.length-1 ? 'Посмотреть результат →' : 'Следующий вопрос →'; $('#quiz-next').hidden = false; }); return button; }));
}
$('#quiz-next').addEventListener('click', () => { if (quizStep === questions.length) { quizStep=0; score=0; } else quizStep++; renderQuiz(); }); renderQuiz();
function status(id,message,error=false) { const element = document.getElementById(id); element.textContent=message; element.classList.toggle('error',error); }
async function submitForm(form, statusId, task) { const button = form.querySelector('[type=submit]'); button.disabled=true; status(statusId,'Отправляем…'); try { await task(); } catch(error) { status(statusId,error.message,true); } finally { button.disabled=false; } }
$$('input[name=attending]').forEach(input => input.addEventListener('change', () => { $('#attendance-fields').hidden = input.value === 'no' && input.checked; }));
$('#rsvp-form').addEventListener('submit', event => { event.preventDefault(); const form=event.currentTarget, data=new FormData(form); submitForm(form,'rsvp-status',async () => {
 const attending=data.get('attending')==='yes';
 await request('/api/confirm-attendance',json({ name:data.get('name'),surname:data.get('surname'),guess:data.get('guess'),details:{ attending,events:data.get('events'),guests:attending?Number(data.get('guests')):1,dietary:attending?data.get('dietary'):'',song:attending?data.get('song'):'' } }));
 status('rsvp-status', attending ? `Спасибо, ${data.get('name')}! Сохранили ваш ответ и будем ждать вас ♡` : `Спасибо за ответ, ${data.get('name')}. Будем мысленно рядом ♡`); form.reset(); $('#attendance-fields').hidden=false;
 }); });
async function loadWishes() { try { const wishes=await request('/api/wishes'); if (!wishes.length) return; $('#wish-list').replaceChildren(...wishes.map(wish=>{const article=document.createElement('article');article.className='wish-card';const p=document.createElement('p');p.textContent=wish.message;const author=document.createElement('span');author.textContent=wish.author;article.append(p,author);return article;})); } catch { $('#wish-list').textContent='Пожелания пока не загрузились. Вы всё равно можете оставить своё ниже.'; } }
$('#wish-form').addEventListener('submit', event => { event.preventDefault();const form=event.currentTarget,data=new FormData(form);submitForm(form,'wish-status',async()=>{const response=await request('/api/wishes',json({author:data.get('author'),message:data.get('message')}));status('wish-status',response.message);form.reset();}); });
async function loadPhotos() { try { const photos=await request('/api/photos');if (!photos.length) {$('#guest-photos').textContent='Первые кадры появятся здесь после праздника. Можно начать альбом уже сейчас.';return;}const set=photos.map(photo=>({src:`/api/photos/${photo.id}/image`,caption:`Фото: ${photo.author}`}));$('#guest-photos').replaceChildren(...photos.map((photo,index)=>{const button=document.createElement('button');button.type='button';const img=document.createElement('img');img.src=set[index].src;img.alt=set[index].caption;img.loading='lazy';const span=document.createElement('span');span.textContent=photo.author;button.append(img,span);button.addEventListener('click',()=>showPhoto(set,index));return button;}));}catch{$('#guest-photos').textContent='Фотоальбом пока не загрузился. Попробуйте обновить страницу позже.';} }
$('#photo-form').addEventListener('submit', event=>{event.preventDefault();const form=event.currentTarget,data=new FormData(form),file=data.get('photo');submitForm(form,'photo-status',async()=>{if(!file.size||file.size>12*1024*1024)throw new Error('Выберите фотографию размером до 12 МБ.');const response=await request('/api/photos',{method:'POST',headers:{'Content-Type':file.type,'X-Photo-Author':encodeURIComponent(data.get('author'))},body:file});status('photo-status',response.message);form.reset();});});
$('#share-album').addEventListener('click',async()=>{const url=`${location.origin}/#album`;try{if(navigator.share){await navigator.share({title:'Фотоальбом Ильяса и Султание',url});return;}if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(url);else{const field=document.createElement('textarea');field.value=url;field.style.position='fixed';field.style.opacity='0';document.body.append(field);field.select();if(!document.execCommand('copy'))throw new Error();field.remove();}toast('Ссылка на альбом скопирована');}catch(error){if(error.name!=='AbortError')toast(`Ссылка на альбом: ${url}`);}});
// A quiet original music-box melody, created locally after an explicit click.
let audioContext, musicGain, musicTimer, melodyStep=0;
const melody=[261.63,329.63,392,523.25,440,392,329.63,293.66,261.63,329.63,392,440,392,329.63,293.66,261.63];
function musicNote(){const now=audioContext.currentTime;const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.type='sine';oscillator.frequency.value=melody[melodyStep++%melody.length];gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.17,now+.03);gain.gain.exponentialRampToValueAtTime(.001,now+1.7);oscillator.connect(gain);gain.connect(musicGain);oscillator.start(now);oscillator.stop(now+1.8);}
async function stopMusic(){clearInterval(musicTimer);if(audioContext)await audioContext.suspend();$('#music').setAttribute('aria-pressed','false');$('#music').title='Включить музыку';}
$('#music').addEventListener('click',async()=>{try{if($('#music').getAttribute('aria-pressed')==='true'){await stopMusic();return;}const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){toast('Ваш браузер не поддерживает музыку.');return;}if(!audioContext){audioContext=new Audio();musicGain=audioContext.createGain();musicGain.gain.value=.3;musicGain.connect(audioContext.destination);}await audioContext.resume();musicNote();musicTimer=setInterval(musicNote,850);$('#music').setAttribute('aria-pressed','true');$('#music').title='Выключить музыку';}catch{toast('Не удалось включить музыку. Попробуйте ещё раз.');}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&$('#music').getAttribute('aria-pressed')==='true')stopMusic();});
loadWishes();loadPhotos();
