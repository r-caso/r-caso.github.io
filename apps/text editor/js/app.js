import { md, rUl, rOl } from './markdown.js';

var $=function(id){return document.getElementById(id)};
var ed=$('ed'), pv=$('pv'), main=$('main'), nameEl=$('name');
var KEY='text-editor:v1';
var st={text:'',name:'untitled',mode:'md',wrap:true,preview:true,theme:''};
var mq=window.matchMedia('(max-width:700px)'), mobilePv=false; // phones show editor OR preview

// ---------- State / persistence ----------
function load(){try{var s=JSON.parse(localStorage.getItem(KEY));if(s)for(var k in s)st[k]=s[k]}catch(e){}}
var timer;
function persist(){
  $('s-save').textContent='Saving…';
  clearTimeout(timer);
  timer=setTimeout(function(){
    try{localStorage.setItem(KEY,JSON.stringify(st));$('s-save').textContent='Autosaved in this browser'}
    catch(e){$('s-save').textContent='Autosave unavailable'}
  },400);
}

// ---------- UI sync ----------
function applyTheme(){
  if(st.theme) document.documentElement.setAttribute('data-theme',st.theme);
  else document.documentElement.removeAttribute('data-theme');
}
function stats(){
  var t=ed.value, w=(t.trim().match(/\S+/g)||[]).length;
  $('s-count').textContent=w+' words · '+t.length+' characters';
  var before=t.slice(0,ed.selectionStart).split('\n');
  $('s-pos').textContent='Ln '+before.length+', Col '+(before[before.length-1].length+1);
}
function renderPreview(){ if(!pv.classList.contains('hidden')) pv.innerHTML=md(ed.value); }
function syncView(){
  var isMd=st.mode==='md', mobile=mq.matches;
  var showPv=isMd&&(mobile?mobilePv:st.preview);
  $('m-md').setAttribute('aria-pressed',isMd);
  $('m-txt').setAttribute('aria-pressed',!isMd);
  $('wrap').setAttribute('aria-pressed',st.wrap);
  if(mobile){$('prev').removeAttribute('aria-pressed');$('prev').textContent=showPv?'Edit':'Preview'}
  else{$('prev').setAttribute('aria-pressed',st.preview);$('prev').textContent='Preview'}
  $('prev').classList.toggle('hidden',!isMd);
  $('tools').classList.toggle('hidden',!isMd||(mobile&&showPv));
  pv.classList.toggle('hidden',!showPv);
  main.classList.toggle('split',showPv&&!mobile);
  ed.classList.toggle('hidden',mobile&&showPv);
  ed.classList.toggle('nowrap',!st.wrap);
  ed.classList.toggle('prose',!isMd);
  renderPreview();
}
function changed(){st.text=ed.value;renderPreview();stats();persist()}

// ---------- Editing helpers (execCommand keeps native undo/redo) ----------
function insert(text){
  ed.focus();
  if(!document.execCommand('insertText',false,text)) ed.setRangeText(text,ed.selectionStart,ed.selectionEnd,'end');
  changed();
}
function wrapSel(a,b,ph){
  var s=ed.selectionStart,e=ed.selectionEnd,sel=ed.value.slice(s,e)||ph;
  insert(a+sel+b);
  ed.setSelectionRange(s+a.length,s+a.length+sel.length);
}
function lineOp(fn){
  var v=ed.value,s=ed.selectionStart,e=ed.selectionEnd;
  var a=v.lastIndexOf('\n',s-1)+1, b=v.indexOf('\n',e); if(b<0)b=v.length;
  ed.setSelectionRange(a,b);
  var lines=v.slice(a,b).split('\n');
  insert(lines.map(fn).join('\n'));
}
var act={
  bold:function(){wrapSel('**','**','bold')},
  italic:function(){wrapSel('*','*','italic')},
  code:function(){wrapSel('`','`','code')},
  link:function(){
    var s=ed.selectionStart,e=ed.selectionEnd,sel=ed.value.slice(s,e)||'text';
    insert('['+sel+'](https://)');
    ed.setSelectionRange(s+sel.length+3,s+sel.length+11);
  },
  h:function(){lineOp(function(l){var m=/^(#{1,6})\s/.exec(l);return m?(m[1].length<6?'#'+l:l.replace(/^#{1,6}\s/,'')):'# '+l})},
  ul:function(){lineOp(function(l){return rUl.test(l)?l.replace(rUl,''):'- '+l})},
  ol:function(){var k=0;lineOp(function(l){k++;return rOl.test(l)?l.replace(rOl,''):k+'. '+l})},
  quote:function(){lineOp(function(l){return /^>\s?/.test(l)?l.replace(/^>\s?/,''):'> '+l})}
};

// ---------- File actions ----------
function ext(){return st.mode==='md'?'.md':'.txt'}
function save(){
  var n=(nameEl.value.trim()||'untitled').replace(/\.(txt|md|markdown)$/i,'')+ext();
  var a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([ed.value],{type:'text/plain;charset=utf-8'}));
  a.download=n; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){URL.revokeObjectURL(a.href)},1000);
  $('s-save').textContent='Downloaded '+n;
}
function openFile(f){
  if(!f) return;
  var r=new FileReader();
  r.onload=function(){
    ed.value=r.result;
    nameEl.value=f.name.replace(/\.[^.]+$/,'');
    st.name=nameEl.value;
    st.mode=/\.(md|markdown)$/i.test(f.name)?'md':'txt';
    ed.setSelectionRange(0,0); syncView(); changed();
  };
  r.readAsText(f);
}

// ---------- Events ----------
ed.addEventListener('input',changed);
['keyup','click','select'].forEach(function(ev){ed.addEventListener(ev,stats)});
nameEl.addEventListener('input',function(){st.name=nameEl.value;persist()});
$('m-md').onclick=function(){st.mode='md';syncView();persist()};
$('m-txt').onclick=function(){st.mode='txt';syncView();persist()};
$('wrap').onclick=function(){st.wrap=!st.wrap;syncView();persist()};
$('prev').onclick=function(){if(mq.matches)mobilePv=!mobilePv;else st.preview=!st.preview;syncView();persist()};
mq.addEventListener('change',function(){mobilePv=false;syncView()});
$('theme').onclick=function(){
  var dark=document.documentElement.getAttribute('data-theme')==='dark'||(!st.theme&&matchMedia('(prefers-color-scheme: dark)').matches);
  st.theme=dark?'light':'dark'; applyTheme(); persist();
};
$('new').onclick=function(){
  if(ed.value&&!confirm('Clear the editor and start a new document?')) return;
  ed.value=''; nameEl.value='untitled'; st.name='untitled'; changed(); ed.focus();
};
$('open').onclick=function(){$('file').click()};
$('file').onchange=function(e){openFile(e.target.files[0]);e.target.value=''};
$('save').onclick=save;
$('tools').addEventListener('click',function(e){
  var b=e.target.closest('button[data-a]'); if(b) act[b.dataset.a]();
});
document.addEventListener('keydown',function(e){
  var mod=e.ctrlKey||e.metaKey, k=e.key.toLowerCase();
  if(mod&&k==='s'){e.preventDefault();save()}
  else if(mod&&k==='o'){e.preventDefault();$('file').click()}
  else if(mod&&st.mode==='md'&&document.activeElement===ed&&(k==='b'||k==='i'||k==='k')){
    e.preventDefault(); act[{b:'bold',i:'italic',k:'link'}[k]]();
  }
});
ed.addEventListener('keydown',function(e){
  if(e.key==='Tab'&&!e.shiftKey){e.preventDefault();insert('  ')}
});
['dragover','drop'].forEach(function(ev){document.addEventListener(ev,function(e){
  e.preventDefault(); if(ev==='drop') openFile(e.dataTransfer.files[0]);
})});

// ---------- Init ----------
load();
ed.value=st.text; nameEl.value=st.name;
applyTheme(); syncView(); stats();
$('s-save').textContent='Autosaves in this browser';
