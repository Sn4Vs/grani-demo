'use strict';
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const covers = $$('.cover');
const names = ['Сайкл', 'Бассейн', 'После заката'];
let cover = 0;
function turnCover(step) {
  cover = (cover + step + covers.length) % covers.length;
  covers.forEach((image, i) => {
    image.classList.toggle('visible', i === cover);
    image.setAttribute('aria-hidden', String(i !== cover));
    $$('.progress i')[i].classList.toggle('active', i === cover);
  });
  $('#frame').textContent = '0' + (cover + 1) + ' / 03';
  $('#cover-name').textContent = names[cover];
}
$('#prev').onclick = () => turnCover(-1);
$('#next').onclick = () => turnCover(1);
turnCover(0);

const shots = $$('.shot');
const filters = $$('.filters button');
for (const button of filters) button.onclick = () => {
  const all = button === filters[0];
  filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  $('.grid').classList.toggle('filtered', !all);
  shots.forEach(shot => {
    shot.hidden = !all && shot.dataset.category !== button.textContent;
    if (!shot.hidden && !reduced.matches) shot.animate([{opacity:.35}, {opacity:1}], {duration:300});
  });
  const count = shots.filter(shot => !shot.hidden).length;
  $('.total').textContent = count + (count === 2 ? ' кадра' : ' кадров');
};
const dialog = $('dialog');
let current;
function showImage(shot) {
  current = shot;
  const available = shots.filter(item => !item.hidden);
  $('.full').src = $('a', shot).href;
  $('.full').alt = $('img', shot).alt;
  $('.viewer-bar strong').textContent = $('b', shot).textContent;
  $('.viewer-bar span').textContent = (available.indexOf(shot) + 1) + ' / ' + available.length;
}
function nextImage(step) {
  const available = shots.filter(item => !item.hidden);
  showImage(available[(available.indexOf(current) + step + available.length) % available.length]);
}
for (const shot of shots) $('a', shot).onclick = event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || !dialog.showModal) return;
  event.preventDefault();
  showImage(shot);
  dialog.showModal();
  document.body.style.overflow = 'hidden';
};
$('.close').onclick = () => dialog.close();
$('.back').onclick = () => nextImage(-1);
$('.forth').onclick = () => nextImage(1);
dialog.addEventListener('close', () => {document.body.style.overflow = '';});
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') nextImage(-1);
  if (event.key === 'ArrowRight') nextImage(1);
});

function playIntro() {
  if (reduced.matches || location.hash || scrollY > 10) return;
  const intro = $('.intro'), metal = $('.metal'), die = $('.die'), travel = $('.travel');
  const glyphs = $$('.glyph'), laser = $('.laser'), sparkGroup = $('.sparks');
  const light = $('.front-light'), shaft = $('.shaft',light), aura = $('.aura',light);
  const ray = $('.ray-core',light), impact = $('.focus-light',light), gradient = $('#shaft',light);
  const pageParts = $$('header, main, footer');
  const clamp = n => Math.min(1,Math.max(0,n));
  const ease = t => t*t*(3-2*t);
  let total = 0;
  const routes = $$('.cut').map(path => {
    const length = path.getTotalLength(), start = total;
    total += length;
    const seam = path.cloneNode();
    seam.setAttribute('class', 'seam');
    path.before(seam);
    seam.style.strokeDasharray = length + ' ' + (length+1);
    seam.style.strokeDashoffset = length;
    path.style.strokeDasharray = length + ' ' + (length+1);
    path.style.strokeDashoffset = length;
    return {path,seam,length,start};
  });
  for (let i=0; i<14; i++) sparkGroup.append(document.createElementNS('http://www.w3.org/2000/svg','path'));
  const sparks = [...sparkGroup.children];
  let frame, fallback, done = false;
  function finish() {
    if (done) return;
    done = true;
    cancelAnimationFrame(frame);
    clearTimeout(fallback);
    const skipFocused = document.activeElement === $('.skip');
    intro.hidden = true;
    document.body.classList.remove('playing');
    pageParts.forEach(el => el.inert = false);
    if (skipFocused) $('.brand').focus({preventScroll:true});
    document.removeEventListener('keydown', escape);
    reduced.removeEventListener('change', finish);
  }
  function escape(e) {if (e.key === 'Escape') finish();}
  $('.skip').onclick = finish;
  document.addEventListener('keydown', escape);
  reduced.addEventListener('change', finish);
  intro.hidden = false;
  document.body.classList.add('playing');
  pageParts.forEach(el => el.inert = true);
  const started = performance.now();
  function draw(now) {
    const time = now - started;
    const distance = total * clamp((time-100)/2080);
    for (const {path,seam,length,start} of routes) {
      const traced = clamp((distance-start)/length);
      path.style.strokeDashoffset = length*(1-traced);
      seam.style.strokeDashoffset = length*(1-traced);
      seam.style.opacity = traced > 0 ? 1 : 0;
      path.style.opacity = traced===0 ? 0 : Math.max(.08,1-Math.max(0,distance-start-length)/20);
    }
    light.style.opacity = laser.style.opacity = time>100 && time<2180 ? 1 : 0;
    const route = routes.find(r => r.start+r.length>=distance) || routes.at(-1);
    const tip = route.path.getPointAtLength(distance-route.start);
    laser.setAttribute('transform','translate('+tip.x+' '+tip.y+')');
    const hit = tip.matrixTransform(route.path.getScreenCTM());
    // The source projects beyond the near screen edge. The beam narrows at the metal.
    const ox = innerWidth*.89 + hit.x*.10, oy = innerHeight*1.12;
    const length = Math.hypot(hit.x-ox,hit.y-oy);
    const nx = (oy-hit.y)/length, ny = (hit.x-ox)/length;
    function cone(width) {
      return 'M'+(ox+nx*width)+' '+(oy+ny*width)+' L'+hit.x+' '+hit.y+' L'+(ox-nx*width)+' '+(oy-ny*width)+' Z';
    }
    gradient.setAttribute('x1',ox);gradient.setAttribute('y1',oy);
    gradient.setAttribute('x2',hit.x);gradient.setAttribute('y2',hit.y);
    aura.setAttribute('d',cone(24));shaft.setAttribute('d',cone(7));
    ray.setAttribute('d',cone(2.1));
    impact.setAttribute('transform','translate('+hit.x+' '+hit.y+') scale('+(1+.09*Math.sin(time*.023))+')');
    sparks.forEach((spark,i) => {
      const age = (time/160 + i*.371)%1, angle = i*2.4+time*.0005;
      const speed=4+i%5;
      const x = Math.cos(angle)*age*speed, y = Math.sin(angle)*age*speed+age*age*2;
      spark.setAttribute('d','M'+x+' '+y+' l'+x*.28+' '+y*.28);
      spark.style.opacity = 1-age;
    });
    glyphs.forEach((glyph,i) => {
      const fall = clamp((time-2220-i*104)/580);
      $('.void',glyph).style.opacity = clamp((time-2130)/95);
      const slug = $('.slug',glyph);
      slug.style.opacity = clamp((time-1960)/230)*(1-fall**3);
      slug.style.transform = 'translateY('+fall*fall*140+'px) rotate('+fall*(i%2?9:-11)+'deg)';
    });
    die.style.opacity = 1-clamp((time-3220)/280);
    travel.style.opacity = ease(clamp((time-3150)/490));
    const fly = ease(clamp((time-3790)/820));
    const from = die.getBoundingClientRect(), to = $('.brand img').getBoundingClientRect();
    travel.style.left = (from.left+(to.left-from.left)*fly)+'px';
    travel.style.top = (from.top+(to.top-from.top)*fly)+'px';
    travel.style.width = from.width+'px';
    travel.style.transform = 'scale('+(1+(to.width/from.width-1)*fly)+')';
    metal.style.opacity = 1-ease(clamp((time-3780)/810));
    $('.skip').style.opacity = 1-fly;
    if (time>=4620) finish(); else frame=requestAnimationFrame(draw);
  }
  fallback = setTimeout(finish,6200);
  draw(started);
}
playIntro();
