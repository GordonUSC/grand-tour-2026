/* shared: nav state, scroll reveal, count-ups, mini-maps */
(function(){
  var here=location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('nav.tour a').forEach(function(a){if(a.getAttribute('href')===here)a.classList.add('on');else a.classList.remove('on');});
  var io=('IntersectionObserver' in window)?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:0.12}):null;
  document.querySelectorAll('.rv').forEach(function(el){io?io.observe(el):el.classList.add('in');});
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-count]').forEach(function(el){
    var target=+el.dataset.count;
    if(reduce){el.textContent=target.toLocaleString();return;}
    var t0=null;function step(ts){if(!t0)t0=ts;var p=Math.min(1,(ts-t0)/1200);el.textContent=Math.round(target*(1-Math.pow(1-p,3))).toLocaleString();if(p<1)requestAnimationFrame(step);}
    new IntersectionObserver(function(es,ob){es.forEach(function(e){if(e.isIntersecting){requestAnimationFrame(step);ob.disconnect();}});},{threshold:0.4}).observe(el);
  });
  window.miniMap=function(id,center,zoom,pins){
    if(!window.L||!document.getElementById(id))return;
    var m=L.map(id,{scrollWheelZoom:false,attributionControl:false}).setView(center,zoom);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:15}).addTo(m);
    var cs=getComputedStyle(document.body);var col=cs.getPropertyValue('--city').trim()||'#e8b96f';
    pins.forEach(function(p){
      L.circleMarker(p[0],{radius:7,color:col,weight:2,fillColor:col,fillOpacity:0.5}).addTo(m).bindTooltip(p[1]);
    });
    return m;
  };
})();

/* soft sounds (WebAudio, no files). chime(true)=up, chime(false)=down */
window._ac=null;
window.chime=function(up){try{
  if(!window._ac)window._ac=new (window.AudioContext||window.webkitAudioContext)();
  var ac=window._ac,o=ac.createOscillator(),g=ac.createGain();
  o.type='sine';o.frequency.value=up?660:330;
  g.gain.setValueAtTime(0.0001,ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.06,ac.currentTime+0.02);
  g.gain.exponentialRampToValueAtTime(0.0001,ac.currentTime+0.35);
  if(up){o.frequency.exponentialRampToValueAtTime(990,ac.currentTime+0.18);}
  o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+0.4);
}catch(e){}};
/* lightbox */
(function(){
  var imgs=Array.from(document.querySelectorAll('.gal img'));if(!imgs.length)return;
  var lb=document.createElement('div');lb.id='lb';
  lb.innerHTML='<button class="x">Close</button><button class="nav prev">&larr;</button><img alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="><div class="cap"></div><button class="nav next">&rarr;</button>';
  document.body.appendChild(lb);
  var cur=0;
  function show(i){var wasOpen=lb.classList.contains('on');if(!wasOpen)chime(true);cur=(i+imgs.length)%imgs.length;var im=imgs[cur];
    lb.querySelector('img').src=im.src;
    var fc=im.closest('figure').querySelector('figcaption');
    lb.querySelector('.cap').textContent=fc?fc.textContent:'';lb.classList.add('on');}
  imgs.forEach(function(im,i){im.style.cursor='zoom-in';im.addEventListener('click',function(){show(i);});});
  lb.querySelector('.x').onclick=function(){lb.classList.remove('on');};
  lb.querySelector('.prev').onclick=function(e){e.stopPropagation();show(cur-1);};
  lb.querySelector('.next').onclick=function(e){e.stopPropagation();show(cur+1);};
  lb.addEventListener('click',function(e){if(e.target===lb)lb.classList.remove('on');});
  var tx0=null;
  lb.addEventListener('touchstart',function(e){tx0=e.touches[0].clientX;},{passive:true});
  lb.addEventListener('touchend',function(e){if(tx0===null)return;var dx=e.changedTouches[0].clientX-tx0;
    if(Math.abs(dx)>48){show(cur+(dx<0?1:-1));}tx0=null;},{passive:true});
  document.addEventListener('keydown',function(e){if(!lb.classList.contains('on'))return;
    if(e.key==='Escape')lb.classList.remove('on');if(e.key==='ArrowRight')show(cur+1);if(e.key==='ArrowLeft')show(cur-1);});
})();
/* listen buttons: data-audio on .listen */
(function(){
  var player=null;
  document.querySelectorAll('.listen[data-audio]').forEach(function(b){
    b.addEventListener('click',function(){
      if(!player){player=new Audio();}
      if(!player.paused&&player._src===b.dataset.audio){player.pause();b.querySelector('.tx').textContent=b.dataset.label||'Listen';return;}
      player.pause();player.src=b.dataset.audio;player._src=b.dataset.audio;
      var p=player.play();if(p&&p.catch)p.catch(function(){});
      b.querySelector('.tx').textContent='Playing…';
      player.onended=function(){b.querySelector('.tx').textContent=b.dataset.label||'Listen';
        if(b.dataset.audio&&b.dataset.audio.indexOf('darby_letter')>-1){
          var p=document.getElementById('letterheard');if(p)p.style.display='block';
          if(window.chime)chime(true);}};
    });
  });
})();
/* animated route dot (hub) */
window.routeDot=function(map,pts,color){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var marker=L.circleMarker(pts[0],{radius:5,color:'#fff',weight:2,fillColor:color,fillOpacity:1}).addTo(map);
  var seg=0,t=0;
  function lerp(a,b,t){return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t];}
  function tick(){
    t+=0.012;
    if(t>=1){t=0;seg=(seg+1)%(pts.length-1);}
    marker.setLatLng(lerp(pts[seg],pts[seg+1],t));
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
};
/* volume bars animate */
(function(){
  var bars=document.querySelectorAll('.volbars .fill');if(!bars.length)return;
  new IntersectionObserver(function(es,ob){es.forEach(function(e){if(e.isIntersecting){
    bars.forEach(function(f){f.style.width=f.dataset.w;});ob.disconnect();}});},{threshold:0.4}).observe(document.querySelector('.volbars'));
})();

/* ---- encore: shared audio infra ---- */
(function(){
  function AC(){if(!window._ac)window._ac=new (window.AudioContext||window.webkitAudioContext)();return window._ac;}
  /* generative ambience per city */
  var amb=null;
  function stopAmb(){if(amb){try{amb.gain.gain.setTargetAtTime(0.0001,AC().currentTime,0.4);var a=amb;setTimeout(function(){a.nodes.forEach(function(n){try{n.stop&&n.stop();n.disconnect&&n.disconnect();}catch(e){}});},900);}catch(e){}amb=null;}}
  function noise(ac){var b=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);var d=b.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;var s=ac.createBufferSource();s.buffer=b;s.loop=true;return s;}
  function startAmb(){
    var ac=AC();stopAmb();
    var city=document.body.className.match(/winnipeg|wiscago|newyork|seattle/);city=city?city[0]:'hub';
    var g=ac.createGain();g.gain.value=0.0001;g.connect(ac.destination);
    var nodes=[];
    var n=noise(ac),f=ac.createFilter?null:null;
    var lp=ac.createBiquadFilter();lp.type='lowpass';
    var ng=ac.createGain();
    var cfg={winnipeg:[420,0.05],wiscago:[650,0.045],newyork:[210,0.075],seattle:[520,0.05],hub:[350,0.04]}[city];
    lp.frequency.value=cfg[0];ng.gain.value=cfg[1];
    n.connect(lp);lp.connect(ng);ng.connect(g);n.start();nodes.push(n);
    var lfo=ac.createOscillator(),lg=ac.createGain();lfo.frequency.value=0.08;lg.gain.value=cfg[1]*0.5;
    lfo.connect(lg);lg.connect(ng.gain);lfo.start();nodes.push(lfo);
    if(city==='winnipeg'||city==='seattle'){ /* crickets / birds: random high blips */
      var t=setInterval(function(){if(!amb)return;var o=ac.createOscillator(),og=ac.createGain();
        o.type='sine';o.frequency.value=(city==='winnipeg'?3800:2400)+Math.random()*900;
        og.gain.setValueAtTime(0.0001,ac.currentTime);og.gain.exponentialRampToValueAtTime(0.015,ac.currentTime+0.03);
        og.gain.exponentialRampToValueAtTime(0.0001,ac.currentTime+0.22);
        o.connect(og);og.connect(g);o.start();o.stop(ac.currentTime+0.25);},city==='winnipeg'?900:2600);
      nodes.push({stop:function(){clearInterval(t);}});
    }
    g.gain.setTargetAtTime(1,ac.currentTime,1.2);
    amb={gain:g,nodes:nodes};
  }
  var on=false;try{on=localStorage.getItem('tour_amb')==='1';}catch(e){}
  var nav=document.querySelector('nav.tour .in');
  if(nav){var b=document.createElement('button');b.className='ambbtn';b.setAttribute('aria-pressed',on?'true':'false');
    b.textContent='Ambience';nav.appendChild(b);
    b.onclick=function(){on=!on;b.setAttribute('aria-pressed',on?'true':'false');
      try{localStorage.setItem('tour_amb',on?'1':'0');}catch(e){}
      if(on)startAmb();else stopAmb();};
    if(on){var arm=function(){startAmb();document.removeEventListener('touchstart',arm);document.removeEventListener('click',arm);};
      document.addEventListener('touchstart',arm,{once:true});document.addEventListener('click',arm,{once:true});}
  }
  document.addEventListener('visibilitychange',function(){if(document.hidden)stopAmb();else if(on)startAmb();});
  /* kinetic hero words */
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    var h1=document.querySelector('header.hero h1');
    if(h1){var parts=[];h1.childNodes.forEach(function(nd){
      if(nd.nodeType===3){nd.textContent.split(/(\s+)/).forEach(function(w){parts.push(/^\s+$/.test(w)?w:'<span>'+w+'</span>');});}
      else{parts.push('<span>'+nd.outerHTML+'</span>');}});
      h1.innerHTML=parts.join('');h1.classList.add('kin');
      h1.querySelectorAll('span').forEach(function(s,i){s.style.animationDelay=(0.08+i*0.07)+'s';});}
  }
  /* flip-fact tiles */
  document.querySelectorAll('.stat[data-fact]').forEach(function(t){
    var f=document.createElement('div');f.className='facttext';f.textContent=t.dataset.fact;t.appendChild(f);
    t.addEventListener('click',function(){t.classList.toggle('flipped');if(window.chime)chime(true);});
  });
  /* hold-to-reveal */
  window.holdReveal=function(btn,secs,done){
    var c=btn.querySelector('circle');var t0=null,raf=null,fired=false;
    function frame(ts){if(!t0)t0=ts;var p=Math.min(1,(ts-t0)/(secs*1000));
      c.style.strokeDashoffset=245*(1-p);
      if(p>=1&&!fired){fired=true;done();return;}
      raf=requestAnimationFrame(frame);}
    function start(e){e.preventDefault();if(fired)return;t0=null;raf=requestAnimationFrame(frame);}
    function stop(){if(fired)return;cancelAnimationFrame(raf);c.style.strokeDashoffset=245;}
    if(window.PointerEvent){btn.addEventListener('pointerdown',start);
      ['pointerup','pointerleave','pointercancel'].forEach(function(ev){btn.addEventListener(ev,stop);});}
    else{btn.addEventListener('mousedown',start);btn.addEventListener('touchstart',start,{passive:false});
      ['mouseup','mouseleave','touchend','touchcancel'].forEach(function(ev){btn.addEventListener(ev,stop);});}
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){btn.addEventListener('click',function(){if(!fired){fired=true;done();}});}
  };
  /* synth pad */
  window.padPlay=function(kind){var ac=AC();var g=ac.createGain();g.connect(ac.destination);
    g.gain.setValueAtTime(0.0001,ac.currentTime);
    if(kind==='kick'){var o=ac.createOscillator();o.frequency.setValueAtTime(120,ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(38,ac.currentTime+0.22);
      g.gain.exponentialRampToValueAtTime(0.22,ac.currentTime+0.012);g.gain.exponentialRampToValueAtTime(0.0001,ac.currentTime+0.34);
      o.connect(g);o.start();o.stop(ac.currentTime+0.36);}
    else if(kind==='chord'){[523.25,659.25,784].forEach(function(fq,i){var o=ac.createOscillator();o.type='triangle';o.frequency.value=fq;
      var og=ac.createGain();og.gain.setValueAtTime(0.0001,ac.currentTime);og.gain.exponentialRampToValueAtTime(0.05,ac.currentTime+0.03+i*0.02);
      og.gain.exponentialRampToValueAtTime(0.0001,ac.currentTime+0.9);o.connect(og);og.connect(ac.destination);o.start();o.stop(ac.currentTime+1);});}
    else if(kind==='lead'){var o=ac.createOscillator();o.type='sawtooth';o.frequency.value=880;
      var flt=ac.createBiquadFilter();flt.type='lowpass';flt.frequency.setValueAtTime(400,ac.currentTime);
      flt.frequency.exponentialRampToValueAtTime(4200,ac.currentTime+0.18);
      g.gain.exponentialRampToValueAtTime(0.07,ac.currentTime+0.02);g.gain.exponentialRampToValueAtTime(0.0001,ac.currentTime+0.5);
      o.connect(flt);flt.connect(g);o.start();o.stop(ac.currentTime+0.55);}
    else{var b=ac.createBuffer(1,ac.sampleRate*0.8,ac.sampleRate);var d=b.getChannelData(0);
      for(var i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
      var s=ac.createBufferSource();s.buffer=b;var hp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=900;
      g.gain.setValueAtTime(0.12,ac.currentTime);s.connect(hp);hp.connect(g);s.start();}
  };
})();

/* thank-you trail */
(function(){
  var KEY='tour_hearts_v1';var st={};
  try{st=JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(st));}catch(e){}}
  window.heartsFound=function(){return Object.keys(st).length;};
  document.querySelectorAll('.heartmark').forEach(function(h){
    var id=h.dataset.h;
    if(st[id]){h.classList.add('found');var c=document.getElementById('hc_'+id);if(c)c.classList.add('show');}
    h.addEventListener('click',function(){
      var card=document.getElementById('hc_'+id);
      if(!st[id]){st[id]=1;save();h.classList.add('found');if(window.chime)chime(true);}
      if(card)card.classList.toggle('show');
      var n=Object.keys(st).length;
      if(n===5&&!st._told){st._told=1;save();
        var t=document.createElement('div');
        t.style.cssText='position:fixed;left:50%;transform:translateX(-50%);top:calc(14px + env(safe-area-inset-top));z-index:300;background:var(--card);border:1px solid var(--gold);color:var(--ink);border-radius:14px;padding:14px 20px;font-family:var(--serif);font-size:17px;box-shadow:0 14px 40px -10px rgba(0,0,0,0.6)';
        t.textContent='All five hearts found. The Mirror Room is open on The Tour page.';
        document.body.appendChild(t);setTimeout(function(){t.remove();},5200);}
    });});
  var mr=document.getElementById('mirror');
  if(mr){var n=window.heartsFound();
    var cnt=document.getElementById('mrcount');if(cnt)cnt.textContent=n+' of 5';
    if(n>=5){mr.classList.remove('locked');mr.classList.add('unlocked');
      if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&!sessionStorage.getItem('mr_c')){
        sessionStorage.setItem('mr_c','1');
        var cols=['#e8b96f','#c77dde','#9d8cff','#7fcf9e'];
        for(var k=0;k<34;k++){var d=document.createElement('div');
          d.style.cssText='position:fixed;top:-12px;width:9px;height:14px;z-index:120;left:'+(Math.random()*100)+'vw;background:'+cols[k%4]+';animation:cfall 1.8s ease-in forwards;animation-delay:'+(Math.random()*0.5)+'s';
          document.body.appendChild(d);(function(x){setTimeout(function(){x.remove();},2700);})(d);}}}
  }
})();
