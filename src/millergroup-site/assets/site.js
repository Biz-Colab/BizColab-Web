/* THE MILLER GROUP — site.js
   Small, dependency-free. Six jobs:
   1 mobile nav · 2 phones never fetch video · 3 work filters
   4 contact form · 5 widow fixer (no line under 3 words / labels 2) + .fit · 6 concept "why" toggle */
(function(){
  /* 1 ─ nav */
  var bar=document.querySelector('.bar'),tog=document.querySelector('.navtog');
  if(tog){tog.addEventListener('click',function(){bar.classList.toggle('open');tog.setAttribute('aria-expanded',bar.classList.contains('open'))})}

  /* 2 ─ video: only ≥760px screens get the mp4; phones get the poster */
  var vids=document.querySelectorAll('video[data-src]');
  var wide=window.matchMedia('(min-width:760px)').matches;
  vids.forEach(function(v){
    if(wide){v.src=v.getAttribute('data-src');return}
    var i=document.createElement('img');
    i.src=v.getAttribute('poster');i.alt='';i.loading='lazy';i.decoding='async';
    v.parentNode.replaceChild(i,v);
  });

  /* 3 ─ work filters (data-ind on .case, data-f on buttons) */
  var fl=document.querySelector('.filters');
  if(fl){
    fl.addEventListener('click',function(e){
      var b=e.target.closest('button');if(!b)return;
      fl.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed','false')});
      b.setAttribute('aria-pressed','true');
      var f=b.getAttribute('data-f');
      document.querySelectorAll('.case[data-ind]').forEach(function(c){
        c.hidden=!(f==='all'||(c.getAttribute('data-ind')||'').split('|').indexOf(f)>-1);
      });
      if(window.__fixWidows)window.__fixWidows();
    });
  }

  /* 4 ─ contact form: POST JSON to data-endpoint if set, else fall back to mailto */
  var form=document.querySelector('form.form');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var data={};new FormData(form).forEach(function(v,k){data[k]=v});
      data.page=location.pathname;
      window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'form_submit',form:'contact'});
      var ep=form.getAttribute('data-endpoint');
      function done(){form.classList.add('sent');form.querySelector('.ok').scrollIntoView({behavior:'smooth',block:'center'})}
      if(ep){
        fetch(ep,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)})
          .then(done).catch(function(){location.href=form.getAttribute('data-mailto')+'?subject='+encodeURIComponent('Website inquiry from '+(data.first||'')+' '+(data.last||''))+'&body='+encodeURIComponent(data.message||'')});
      }else{
        location.href=form.getAttribute('data-mailto')+'?subject='+encodeURIComponent('Website inquiry from '+(data.first||'')+' '+(data.last||'')+(data.company?' · '+data.company:''))+'&body='+encodeURIComponent((data.message||'')+'\n\n— '+(data.email||''));
        done();
      }
    });
  }

  /* 5 ─ widow fixer: nowrap-span binding (NBSP binding is broken in Chromium).
     Text/display type: no rendered line under 3 words. Labels: under 2.
     Elements inside or containing .h-line are deliberate breaks — skipped. */
  var TXT='h1,h2,h3,p:not(.details):not(.q):not(.d),.dash li,.qq,.story,.oneloop,.big,.kick,.lede,.sub,.whop,.cs-block p,.memo li,.tm span';
  var LAB='.sf b,.sf>span:not(.n),.cred b,.cred span,.stat span,.statrow span,.case .q cite,.phone p,.chip,.cs-result span,.cs-meta span,.recog,footer .cols a,.pill,.filters button,.posts .d';
  function unwrap(el){el.querySelectorAll('span.nwfix').forEach(function(s){s.parentNode.replaceChild(document.createTextNode(s.textContent),s)});el.normalize()}
  function lines(el){
    var r=[],range=document.createRange(),w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),node;
    while(node=w.nextNode()){var t=node.nodeValue,i=0;while(i<t.length){var j=t.indexOf(' ',i);if(j===-1)j=t.length;if(j>i){range.setStart(node,i);range.setEnd(node,j);var rc=range.getClientRects();if(rc.length)r.push(rc[0].top)}i=j+1}}
    return r;
  }
  function clusters(tops){tops.sort(function(a,b){return a-b});var c=[];tops.forEach(function(t){if(c.length&&t-c[c.length-1].t<=8){c[c.length-1].n++;c[c.length-1].t=t}else c.push({t:t,n:1})});return c}
  function hasWidow(el,min){var c=clusters(lines(el));if(c.length<2)return false;for(var i=0;i<c.length;i++){if(c[i].n<min)return true}return false}
  function fix(el,min){
    if(!hasWidow(el,min))return;
    for(var n=min;n<=min+3;n++){
      unwrap(el);
      var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),node,all=[];while(node=w.nextNode())all.push(node);
      if(!all.length)return;
      var last=all[all.length-1],txt=last.nodeValue,parts=txt.split(' ').filter(function(x){return x.length});
      if(parts.length<n)break;
      var tail=parts.slice(-n).join(' '),idx=txt.lastIndexOf(tail);if(idx<0)break;
      var w0=el.getBoundingClientRect().width;
      last.nodeValue=txt.slice(0,idx);
      var s=document.createElement('span');s.className='nwfix';s.style.whiteSpace='nowrap';s.textContent=tail;last.parentNode.appendChild(s);
      if(el.getBoundingClientRect().width>w0+1||el.scrollWidth>el.clientWidth+1||s.getBoundingClientRect().right>document.documentElement.clientWidth){unwrap(el);continue}
      if(!hasWidow(el,min))return;
    }
  }
  /* fit: shrink font until the element renders on ONE line (floor 18px). Used on case-study h1s. */
  function fit(el){el.style.fontSize='';var sz=parseFloat(getComputedStyle(el).fontSize);while(sz>18&&clusters(lines(el)).length>1){sz-=1;el.style.fontSize=sz+'px'}}
  function run(){
    document.querySelectorAll('.fit').forEach(fit);
    document.querySelectorAll(TXT).forEach(function(el){if(el.closest('.h-line')||el.querySelector('.h-line')||el.hidden||el.closest('[hidden]'))return;unwrap(el);fix(el,3)});
    document.querySelectorAll(LAB).forEach(function(el){if(el.closest('.h-line')||el.querySelector('.h-line')||el.hidden||el.closest('[hidden]'))return;unwrap(el);fix(el,2)});
  }
  window.__fixWidows=run;
  window.addEventListener('load',run);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(run);
  var t;window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(run,150)});

  /* 6 ─ concept rationale toggle */
  var wb=document.getElementById('whyBtn');
  if(wb){wb.addEventListener('click',function(){document.body.classList.toggle('showwhy');wb.textContent=document.body.classList.contains('showwhy')?'HIDE RATIONALE':'WHY THIS PAGE?';run()})}
})();
