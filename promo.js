(function(){'use strict';
var started=false,stream=null,canvas=null,ctx=null,timer=null;
var trackedVideos=new Set();
var lines=['SEELARY','MARKETING, SIMPLIFIED','GROW YOUR BRAND FASTER','CREATE  •  LAUNCH  •  GROW','TURN ATTENTION INTO CUSTOMERS'];
var SCREEN_RE=/(?:screen|sign|billboard|display|poster|logo|neon|text|label|banner)/i;

function mediaUrl(v){try{return String(v.currentSrc||v.src||v.getAttribute&&v.getAttribute('src')||'')}catch(e){return''}}
function isLoadingVideo(v){return /\/videos\/loading\.(?:mp4|webm)(?:$|[?#])/i.test(mediaUrl(v))}
function isProjectVideo(v){var s=mediaUrl(v);return /\/videos\/[^/]+\.(?:mp4|webm|mov)(?:$|[?#])/i.test(s)&&!isLoadingVideo(v)}
function trackVideo(v){if(v&&v.tagName==='VIDEO')trackedVideos.add(v);return v}

/* Capture detached videos before the Three.js bundle creates VideoTexture objects from them. */
var nativeCreateElement=Document.prototype.createElement;
Document.prototype.createElement=function(name,options){var el=nativeCreateElement.call(this,name,options);if(String(name).toLowerCase()==='video')trackVideo(el);return el};

function makeStream(){
  if(stream)return stream;
  canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;ctx=canvas.getContext('2d');
  if(!ctx||!canvas.captureStream)return null;
  stream=canvas.captureStream(30);
  var t0=performance.now();
  function draw(now){
    var t=(now-t0)/1000,phase=Math.floor(t/3)%lines.length;
    ctx.fillStyle='#03040a';ctx.fillRect(0,0,canvas.width,canvas.height);
    var g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);g.addColorStop(0,'#6d2cff');g.addColorStop(.5,'#00d9ff');g.addColorStop(1,'#ff2bd6');
    ctx.globalAlpha=.18;ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=1;
    ctx.strokeStyle='rgba(255,255,255,.16)';ctx.lineWidth=2;
    for(var x=-200;x<canvas.width+200;x+=80){ctx.beginPath();ctx.moveTo(x+(t*35)%80,0);ctx.lineTo(x-260+(t*35)%80,canvas.height);ctx.stroke()}
    ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 116px Arial,Helvetica,sans-serif';ctx.fillText('SEELARY',canvas.width/2,275);
    ctx.font='600 46px Arial,Helvetica,sans-serif';ctx.fillText(lines[phase],canvas.width/2,410);
    ctx.font='400 26px Arial,Helvetica,sans-serif';ctx.fillStyle='rgba(255,255,255,.72)';ctx.fillText('YOUR NEXT GROWTH ENGINE',canvas.width/2,490);
    requestAnimationFrame(draw)
  }
  requestAnimationFrame(draw);return stream
}

function apply(v){
  if(!isProjectVideo(v)||v.dataset.seelaryPromo==='1')return;
  var s=makeStream();if(!s)return;
  try{
    v.dataset.seelaryPromo='1';v.pause();
    while(v.firstChild)v.removeChild(v.firstChild);
    v.removeAttribute('src');v.srcObject=s;v.muted=true;v.loop=true;v.playsInline=true;
    var p=v.play();if(p&&p.catch)p.catch(function(){});
    window.__seelaryPromoVideos=(window.__seelaryPromoVideos||0)+1
  }catch(e){console.warn('[Seelary] tracked VideoTexture swap skipped',e)}
}
function scan(){document.querySelectorAll('video').forEach(trackVideo);trackedVideos.forEach(apply)}

/* Re-run immediately after the app assigns a media URL, including on detached video elements. */
(function(){
  var proto=window.HTMLMediaElement&&HTMLMediaElement.prototype,d=proto&&Object.getOwnPropertyDescriptor(proto,'src');
  if(!d||!d.set)return;
  try{Object.defineProperty(proto,'src',{configurable:true,enumerable:d.enumerable,get:d.get,set:function(v){d.set.call(this,v);if(this.tagName==='VIDEO'){trackVideo(this);var self=this;setTimeout(function(){apply(self)},0)}}})}catch(e){}
})();

function isCityUrl(v){try{return /\/models\/cyberfix\.glb(?:$|[?#])/i.test(new URL(typeof v==='string'?v:(v&&v.url)||'',location.href).href)}catch(e){return false}}
function meshMaterialIndices(mesh,out){if(!mesh||!mesh.primitives)return;for(var i=0;i<mesh.primitives.length;i++){var m=mesh.primitives[i]&&mesh.primitives[i].material;if(Number.isInteger(m))out.add(m)}}
function materialUsesNamedImage(j,mat){
  var hits=[];
  function check(slot){if(!slot||!Number.isInteger(slot.index))return;var tx=j.textures&&j.textures[slot.index];if(!tx)return;var im=Number.isInteger(tx.source)&&j.images&&j.images[tx.source];var name=((tx.name||'')+' '+(im&&((im.name||'')+' '+(im.uri||''))||''));if(SCREEN_RE.test(name))hits.push(name)}
  var p=mat&&mat.pbrMetallicRoughness;check(p&&p.baseColorTexture);check(mat&&mat.emissiveTexture);return hits
}
function scrubScreenMaterials(buffer){
  try{
    var src=new Uint8Array(buffer),dv=new DataView(buffer);
    if(src.length<20||dv.getUint32(0,true)!==0x46546c67||dv.getUint32(4,true)!==2)return src;
    var chunks=[],off=12,jsonIndex=-1,j=null;
    while(off+8<=src.length){var len=dv.getUint32(off,true),type=dv.getUint32(off+4,true),start=off+8,end=start+len;if(end>src.length)break;var data=src.slice(start,end);if(type===0x4e4f534a){jsonIndex=chunks.length;j=JSON.parse(new TextDecoder().decode(data).replace(/\u0000+$/,'').trim())}chunks.push({type:type,data:data});off=end}
    if(!j||jsonIndex<0)return src;

    var targets=new Set(),reasons={};
    function mark(i,reason){if(!Number.isInteger(i)||!j.materials||!j.materials[i])return;targets.add(i);(reasons[i]||(reasons[i]=[])).push(reason)}
    (j.materials||[]).forEach(function(m,i){if(SCREEN_RE.test(m&&m.name||''))mark(i,'material:'+m.name);var named=materialUsesNamedImage(j,m);for(var n=0;n<named.length;n++)mark(i,'image:'+named[n])});
    (j.meshes||[]).forEach(function(mesh,mi){if(SCREEN_RE.test(mesh&&mesh.name||'')){var s=new Set();meshMaterialIndices(mesh,s);s.forEach(function(i){mark(i,'mesh:'+mesh.name)})}});
    (j.nodes||[]).forEach(function(node){if(!SCREEN_RE.test(node&&node.name||'')||!Number.isInteger(node.mesh))return;var mesh=j.meshes&&j.meshes[node.mesh],s=new Set();meshMaterialIndices(mesh,s);s.forEach(function(i){mark(i,'node:'+node.name)})});

    var report=[];
    targets.forEach(function(i){
      var m=j.materials[i],removed=[];
      var p=m.pbrMetallicRoughness||(m.pbrMetallicRoughness={});
      var alpha=Array.isArray(p.baseColorFactor)&&p.baseColorFactor.length>3?p.baseColorFactor[3]:1;
      if(p.baseColorTexture){delete p.baseColorTexture;removed.push('baseColorTexture')}
      if(m.emissiveTexture){delete m.emissiveTexture;removed.push('emissiveTexture')}
      p.baseColorFactor=[0.025,0.03,0.04,alpha];
      m.emissiveFactor=[0,0,0];
      report.push({index:i,name:m.name||('#'+i),removed:removed,reasons:reasons[i]||[]})
    });
    window.__screenMaterialsScrubbed=report;
    console.info('[Seelary] static screen/sign color textures neutralized:',report.length,report);
    if(!report.length)return src;

    var enc=new TextEncoder().encode(JSON.stringify(j)),pad=(enc.length+3)&~3,jd=new Uint8Array(pad);jd.fill(32);jd.set(enc);chunks[jsonIndex].data=jd;
    var total=12;chunks.forEach(function(c){total+=8+c.data.length});
    var out=new Uint8Array(total),odv=new DataView(out.buffer),pos=12;odv.setUint32(0,0x46546c67,true);odv.setUint32(4,2,true);odv.setUint32(8,total,true);
    chunks.forEach(function(c){odv.setUint32(pos,c.data.length,true);odv.setUint32(pos+4,c.type,true);out.set(c.data,pos+8);pos+=8+c.data.length});
    return out
  }catch(e){console.warn('[Seelary] selective cyberfix screen scrub skipped; original city kept.',e);return new Uint8Array(buffer)}
}

/* The bootstrap already owns the first fetch wrapper. Layer the city-only transform on top of it. */
if(window.fetch){
  var previousFetch=window.fetch.bind(window);
  window.fetch=function(input,init){
    if(!isCityUrl(input))return previousFetch(input,init);
    return previousFetch(input,init).then(function(r){if(!r.ok)return r;return r.arrayBuffer().then(function(b){var clean=scrubScreenMaterials(b),h=new Headers(r.headers);h.delete('content-length');h.set('content-type','model/gltf-binary');return new Response(clean,{status:r.status,statusText:r.statusText,headers:h})})})
  }
}

function start(){if(started)return;started=true;window.__seelaryPromoActive=true;scan();timer=setInterval(scan,400);new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true})}
/* Start tracking immediately; delayed rescans cover videos whose source is assigned later. */
start();
})();
