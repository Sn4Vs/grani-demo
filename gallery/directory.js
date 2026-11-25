'use strict';
const records = JSON.parse(document.querySelector('#records').textContent);
const team = document.body.classList.contains('trainers');
const find = selector => document.querySelector(selector);
const links = Array.from(document.querySelectorAll('.index a'));
const normalize = value => value.toLocaleLowerCase('ru').replaceAll('ё','е');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
function el(tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}
let active;
function display(record, scroll) {
  active = record;
  find('.rubric').textContent = record.category || 'Команда клуба';
  find('#subject').textContent = record.name;
  find('.caption').textContent = team ? 'Фитнес-клуб «Грани»' : 'Фотография клуба';
  const mount = find('.mount');
  if (record.photo) {
    const photo = new Image();
    photo.src = record.photo;
    photo.alt = team ? record.name : '';
    mount.replaceChildren(photo);
  } else mount.replaceChildren(el('span',record.initials));
  const copy = find('.copy');
  copy.replaceChildren();
  for (const [heading,text] of record.sections) {
    if (team) copy.append(el('h3', heading));
    for (const line of text.split('\n')) copy.append(el('p',line));
  }
  if (!record.sections.length) copy.append(el('p',team ? 'Профиль готовится к публикации.' : 'Описание пока не добавлено.'));
  const position = records.indexOf(record);
  find('.paging small').textContent = (position+1)+' / '+records.length;
  for(const link of links) {
    if(link.hash.slice(1)===record.id) link.setAttribute('aria-current','true');
    else link.removeAttribute('aria-current');
  }
  if(scroll) {
    find('.spread').focus({preventScroll:true});
    find('.spread').scrollIntoView({behavior:'instant',block:'start'});
    if(!reduceMotion.matches) mount.animate([{opacity:.62},{opacity:1}],{duration:350});
  }
}
function followHash(scroll) {
  const id = location.hash.slice(1);
  const match = records.find(record=>record.id===id);
  if (match || !active) display(match || records.find(record=>record.id===document.body.dataset.first), Boolean(match && scroll));
}
for(const link of links) link.addEventListener('click',event=>{
  if(link.hash===location.hash && !event.metaKey && !event.ctrlKey){event.preventDefault();followHash(true);}
});
function step(delta) {
  location.hash = records[(records.indexOf(active)+delta+records.length)%records.length].id;
}
find('.previous').onclick = ()=>step(-1);
find('.next').onclick = ()=>step(1);
function filterIndex() {
  const query=normalize(find('input').value.trim());
  let visible=0;
  for(const link of links){
    link.hidden=!normalize(link.textContent).includes(query);
    if (!link.hidden) visible++;
  }
  find('.count').textContent=visible+' / '+links.length;
  find('.empty').hidden=visible!==0;
}
find('input').addEventListener('input',filterIndex);
window.addEventListener('hashchange',()=>followHash(true));
filterIndex();
followHash(Boolean(location.hash));
