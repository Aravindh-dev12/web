(function(){'use strict';
var activated=false,stream=null,canvas=null,ctx=null,timer=null;
var trackedVideos=new Set();
var lines=['SEELARY','MARKETING, SIMPLIFIED','GROW YOUR BRAND FASTER','CREATE  •  LAUNCH  •  GROW','TURN ATTENTION INTO CUSTOMERS'];

function mediaUrl(v){try{return String(v.currentSrc||v.src||v.getAttribute&&v.getAttribute('src')||'')}catch(e){return''}}
function isLoadingVideo(v){return /\/videos\/loading\.(?:mp4|webm)(?:$|[?#])/i.test(mediaUrl(v))}
function isProjectVideo(v){var s=mediaUrl(v);return /\/videos\/[^/]+\.(?:mp4|webm|mov)(?:$|[?#])/i.test(s)&&!isLoadingVideo(v)}
function trackVideo(v){if(v&&v.tagName==='VIDEO'){trackedVideos.add(v);window.__seelaryTrackedVideos=trackedVideos.size}return v}

/* Track detached videos before the captured Three.js bundle turns them into VideoTextures. */
var nativeCreateElement=Document.prototype.createElement;
Document.prototype.createElement=function(name,options){var el=nativeCreateElement.call(this,name,options);if(String(name).toLowerCase()==='video')trackVideo(el);return el};

/* Preserve normal media assignment during preload. After activation, newly assigned project videos are swapped. */
(function(){
  var proto=window.HTMLMediaElement&&HTMLMediaElement.prototype;
  var d=proto&&Object.getOwnPropertyDescriptor(proto,'src');
  if(!d||!d.set)return;
  try{
    Object.defineProperty(proto,'src',{
      configurable:true,
      enumerable:d.enumerable,
      get:d.get,
      set:function(v){
        d.set.call(this,v);
        if(this.tagName==='VIDEO'){
          trackVideo(this);
          if(activated){var self=this;setTimeout(function(){apply(self)},0)}
        }
      }
    })
  }catch(e){console.warn('[Seelary] media tracking hook unavailable',e)}
})();

function makeStream(){
  if(stream)return stream;
  canvas=nativeCreateElement.call(document,'canvas');
  canvas.width=1280;canvas.height=720;
  ctx=canvas.getContext('2d');
  if(!ctx||!canvas.captureStream){console.warn('[Seelary] canvas captureStream unavailable');return null}
  stream=canvas.captureStream(30);
  var t0=performance.now();
  function draw(now){
    var t=(now-t0)/1000,phase=Math.floor(t/3)%lines.length;
    ctx.fillStyle='#03040a';ctx.fillRect(0,0,canvas.width,canvas.height);
    var g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);
    g.addColorStop(0,'#6d2cff');g.addColorStop(.5,'#00d9ff');g.addColorStop(1,'#ff2bd6');
    ctx.globalAlpha=.18;ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=1;
    ctx.strokeStyle='rgba(255,255,255,.16)';ctx.lineWidth=2;
    for(var x=-200;x<canvas.width+200;x+=80){ctx.beginPath();ctx.moveTo(x+(t*35)%80,0);ctx.lineTo(x-260+(t*35)%80,canvas.height);ctx.stroke()}
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='700 116px Arial,Helvetica,sans-serif';ctx.fillText('SEELARY',canvas.width/2,275);
    ctx.font='600 46px Arial,Helvetica,sans-serif';ctx.fillText(lines[phase],canvas.width/2,410);
    ctx.font='400 26px Arial,Helvetica,sans-serif';ctx.fillStyle='rgba(255,255,255,.72)';ctx.fillText('YOUR NEXT GROWTH ENGINE',canvas.width/2,490);
    requestAnimationFrame(draw)
  }
  requestAnimationFrame(draw);
  return stream
}

function apply(v){
  if(!activated||!isProjectVideo(v)||v.dataset.seelaryPromo==='1')return;
  var s=makeStream();if(!s)return;
  try{
    v.dataset.seelaryPromo='1';
    v.pause();
    v.srcObject=s;
    v.muted=true;v.loop=true;v.playsInline=true;
    var p=v.play();if(p&&p.catch)p.catch(function(){});
    window.__seelaryPromoVideos=(window.__seelaryPromoVideos||0)+1;
    console.info('[Seelary] swapped tracked VideoTexture source:',mediaUrl(v))
  }catch(e){console.warn('[Seelary] delayed VideoTexture swap skipped',e)}
}

function scan(){
  document.querySelectorAll('video').forEach(trackVideo);
  trackedVideos.forEach(apply);
  window.__seelaryTrackedVideos=trackedVideos.size
}

function activate(){
  if(activated)return;
  activated=true;
  window.__seelaryPromoActive=true;
  scan();
  timer=setInterval(scan,750);
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  console.info('[Seelary] delayed promo activated; tracked videos:',trackedVideos.size)
}

/* Critical safety rule: do not alter any media while Three.js is preloading the city. */
window.addEventListener('load',function(){setTimeout(activate,3500)},{once:true});
})();
