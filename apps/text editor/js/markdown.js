// Small Markdown renderer. Escapes all HTML before formatting.
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function inline(s){
  var stash=[];
  s=esc(s).replace(/`([^`]+)`/g,function(_,c){stash.push(c);return '\u0000'+(stash.length-1)+'\u0000'});
  s=s.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
     .replace(/(^|[^*])\*([^*\s][^*]*)\*/g,'$1<em>$2</em>')
     .replace(/~~(.+?)~~/g,'<del>$1</del>')
     .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s.replace(/\u0000(\d+)\u0000/g,function(_,i){return '<code>'+stash[i]+'</code>'});
}
var rUl=/^\s*[-*+]\s+/, rOl=/^\s*\d+\.\s+/, rH=/^(#{1,6})\s+(.*)$/, rHr=/^\s*([-*_])(\s*\1){2,}\s*$/;
function md(src){
  var L=src.replace(/\r/g,'').split('\n'), out=[], i=0, n=L.length, m;
  while(i<n){
    var l=L[i];
    if(/^```/.test(l)){
      var buf=[]; i++;
      while(i<n && !/^```/.test(L[i])) buf.push(L[i++]);
      i++; out.push('<pre><code>'+esc(buf.join('\n'))+'</code></pre>'); continue;
    }
    if(!l.trim()){i++;continue}
    if((m=rH.exec(l))){out.push('<h'+m[1].length+'>'+inline(m[2])+'</h'+m[1].length+'>');i++;continue}
    if(rHr.test(l)){out.push('<hr>');i++;continue}
    if(/^>/.test(l)){
      var q=[]; while(i<n && /^>/.test(L[i])) q.push(L[i++].replace(/^>\s?/,''));
      out.push('<blockquote>'+md(q.join('\n'))+'</blockquote>'); continue;
    }
    var re=rUl.test(l)?rUl:rOl.test(l)?rOl:null;
    if(re){
      var tag=re===rUl?'ul':'ol', items=[];
      while(i<n && re.test(L[i])) items.push('<li>'+inline(L[i++].replace(re,''))+'</li>');
      out.push('<'+tag+'>'+items.join('')+'</'+tag+'>'); continue;
    }
    var p=[];
    while(i<n && L[i].trim() && !/^```|^>/.test(L[i]) && !rH.test(L[i]) && !rUl.test(L[i]) && !rOl.test(L[i]) && !rHr.test(L[i])) p.push(L[i++]);
    out.push('<p>'+inline(p.join(' '))+'</p>');
  }
  return out.join('\n');
}

export { md, rUl, rOl };
