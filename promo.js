(function(){'use strict';
/*
  Multi-video city wall replacement.
  Sources are Pexels stock videos. The app is allowed to finish its own preload first;
  only already-created project video elements are reassigned after startup.
*/
var activated=false;
var trackedVideos=new Set();
var sourceByVideo=new WeakMap();
var stateByVideo=new WeakMap();
var assignments=[];
var assignmentCursor=0;
var rotateTimer=null;

var VIDEO_POOL=[
  {
    id:'36518063',
    label:'neon-night-drive',
    page:'https://www.pexels.com/video/driving-through-city-at-night-with-neon-lights-36518063/',
    src:'https://videos.pexels.com/video-files/36518063/15484726_3840_2160_30fps.mp4'
  },
  {
    id:'29834228',
    label:'night-city-neon-street',
    page:'https://www.pexels.com/video/night-city-street-scene-with-neon-lights-29834228/',
    src:'https://videos.pexels.com/video-files/29834228/12812829_2160_3840_24fps.mp4'
  },
  {
    id:'32119029',
    label:'urban-nightlife',
    page:'https://www.pexels.com/video/bustling-nightlife-scene-in-urban-city-street-32119029/',
    src:'https://www.pexels.com/download/video/32119029/'
  },
  {
    id:'32636958',
    label:'neon-city-nightlife',
    page:'https://www.pexels.com/video/vibrant-nightlife-in-a-neon-lit-city-32636958/',
    src:'https://www.pexels.com/download/video/32636958/'
  },
  {
    id:'10633329',
    label:'aerial-city-grid',
    page:'https://www.pexels.com/video/drone-footage-of-a-city-10633329/',
    src:'https://www.pexels.com/download/video/10633329/'
  },
  {
    id:'4687195',
    label:'city-skyline-drone',
    page:'https://www.pexels.com/video/drone-footage-of-a-city-4687195/',
    src:'https://www.pexels.com/download/video/4687195/'
  },
  {
    id:'19303831',
    label:'urban-cityscape-drone',
    page:'https://www.pexels.com/video/city-building-drone-shot-19303831/',
    src:'https://www.pexels.com/download/video/19303831/'
  },
  {
    id:'4046192',
    label:'downtown-drone',
    page:'https://www.pexels.com/video/drone-shot-of-the-city-4046192/',
    src:'https://www.pexels.com/download/video/4046192/'
  }
];

function shuffle(a){
  a=a.slice();
  for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}
  return a
}
VIDEO_POOL=shuffle(VIDEO_POOL);
window.__seelaryVideoPool=VIDEO_POOL.map(function(x){return{id:x.id,label:x.label,page:x.page}});
window.__seelaryAssignments=assignments;

function text(v){return v==null?'':String(v)}
function mediaUrl(v){try{return text(v.currentSrc||v.src||v.getAttribute&&v.getAttribute('src')||'')}catch(e){return''}}
function isLoadingUrl(s){return /\/videos\/loading\.(?:mp4|webm)(?:$|[?#])/i.test(text(s))}
function isOriginalProjectUrl(s){return /\/videos\/[^/]+\.(?:mp4|webm|mov)(?:$|[?#])/i.test(text(s))&&!isLoadingUrl(s)}
function originalFor(v){return sourceByVideo.get(v)||mediaUrl(v)}
function isProjectVideo(v){return isOriginalProjectUrl(originalFor(v))}

function trackVideo(v,assignedSource){
  if(!v||v.tagName!=='VIDEO')return v;
  trackedVideos.add(v);
  if(assignedSource&&isOriginalProjectUrl(assignedSource)&&!sourceByVideo.has(v))sourceByVideo.set(v,text(assignedSource));
  window.__seelaryTrackedVideos=trackedVideos.size;
  return v
}

/* Track detached videos before Three.js turns them into VideoTextures. */
var nativeCreateElement=Document.prototype.createElement;
Document.prototype.createElement=function(name,options){
  var el=nativeCreateElement.call(this,name,options);
  if(String(name).toLowerCase()==='video')trackVideo(el);
  return el
};

var mediaProto=window.HTMLMediaElement&&HTMLMediaElement.prototype;
var mediaSrcDescriptor=mediaProto&&Object.getOwnPropertyDescriptor(mediaProto,'src');
if(mediaSrcDescriptor&&mediaSrcDescriptor.set){
  try{
    Object.defineProperty(mediaProto,'src',{
      configurable:true,
      enumerable:mediaSrcDescriptor.enumerable,
      get:mediaSrcDescriptor.get,
      set:function(value){
        mediaSrcDescriptor.set.call(this,value);
        if(this.tagName==='VIDEO'){
          trackVideo(this,value);
          if(activated&&isOriginalProjectUrl(value)){var self=this;setTimeout(function(){assignVideo(self,false)},0)}
        }
      }
    })
  }catch(e){console.warn('[Seelary] video tracking hook unavailable',e)}
}

function nextPoolIndex(avoid){
  if(!VIDEO_POOL.length)return-1;
  var idx=assignmentCursor++%VIDEO_POOL.length;
  if(VIDEO_POOL.length>1&&idx===avoid)idx=assignmentCursor++%VIDEO_POOL.length;
  return idx
}

function record(v,item,status){
  var st=stateByVideo.get(v)||{};
  st.item=item||st.item;
  st.status=status||st.status;
  stateByVideo.set(v,st);
  assignments.length=0;
  trackedVideos.forEach(function(video){
    var s=stateByVideo.get(video);
    if(s&&s.item)assignments.push({original:originalFor(video),pexelsId:s.item.id,label:s.item.label,status:s.status||'unknown'})
  });
  window.__seelaryAssignments=assignments
}

function restoreOriginal(v,reason){
  var original=sourceByVideo.get(v);
  if(!original||!mediaSrcDescriptor||!mediaSrcDescriptor.set)return;
  try{
    v.pause();
    v.crossOrigin='anonymous';
    mediaSrcDescriptor.set.call(v,original);
    v.muted=true;v.loop=true;v.playsInline=true;
    v.load();
    var p=v.play();if(p&&p.catch)p.catch(function(){});
    var st=stateByVideo.get(v)||{};st.status='fallback-original:'+reason;stateByVideo.set(v,st);
    record(v,st.item,st.status)
  }catch(e){console.warn('[Seelary] original video restore failed',e)}
}

function tryPool(v,index,attempt){
  if(!activated||!isProjectVideo(v)||!mediaSrcDescriptor||!mediaSrcDescriptor.set)return;
  attempt=attempt||0;
  if(attempt>=VIDEO_POOL.length){restoreOriginal(v,'pexels-unavailable');return}
  index=(index+VIDEO_POOL.length)%VIDEO_POOL.length;
  var item=VIDEO_POOL[index];
  var st=stateByVideo.get(v)||{};
  st.index=index;st.item=item;st.status='loading';st.attempt=attempt;
  stateByVideo.set(v,st);record(v,item,'loading');

  var settled=false;
  function cleanup(){v.removeEventListener('canplay',onCanPlay);v.removeEventListener('error',onError)}
  function onCanPlay(){
    if(settled)return;settled=true;cleanup();
    var current=stateByVideo.get(v)||{};current.status='playing';stateByVideo.set(v,current);record(v,item,'playing');
    try{
      if(isFinite(v.duration)&&v.duration>4)v.currentTime=Math.min(v.duration-1,Math.random()*Math.max(1,v.duration-2))
    }catch(e){}
    var p=v.play();if(p&&p.catch)p.catch(function(){})
  }
  function onError(){
    if(settled)return;settled=true;cleanup();
    console.warn('[Seelary] Pexels clip failed, trying another:',item.id,item.src);
    tryPool(v,nextPoolIndex(index),attempt+1)
  }
  v.addEventListener('canplay',onCanPlay,{once:true});
  v.addEventListener('error',onError,{once:true});

  try{
    v.pause();
    v.srcObject=null;
    v.crossOrigin='anonymous';
    v.muted=true;v.loop=true;v.playsInline=true;v.preload='auto';
    mediaSrcDescriptor.set.call(v,item.src);
    v.load();
    var timeout=setTimeout(function(){if(!settled){settled=true;cleanup();tryPool(v,nextPoolIndex(index),attempt+1)}},12000);
    v.addEventListener('canplay',function(){clearTimeout(timeout)},{once:true});
    v.addEventListener('error',function(){clearTimeout(timeout)},{once:true});
  }catch(e){cleanup();tryPool(v,nextPoolIndex(index),attempt+1)}
}

function assignVideo(v,forceRotate){
  if(!activated||!isProjectVideo(v))return;
  var st=stateByVideo.get(v);
  if(st&&!forceRotate&&(st.status==='loading'||st.status==='playing'))return;
  var avoid=st&&Number.isInteger(st.index)?st.index:-1;
  tryPool(v,nextPoolIndex(avoid),0)
}

function scan(){
  document.querySelectorAll('video').forEach(function(v){trackVideo(v,mediaUrl(v))});
  trackedVideos.forEach(function(v){assignVideo(v,false)});
  window.__seelaryTrackedVideos=trackedVideos.size
}

function rotate(){
  if(!activated)return;
  trackedVideos.forEach(function(v){if(isProjectVideo(v))assignVideo(v,true)})
}

function activate(){
  if(activated)return;
  activated=true;
  window.__seelaryPromoActive=true;
  scan();
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(scan,1200);
  /* Change the city-wall mix periodically without synchronizing every screen to one clip. */
  rotateTimer=setInterval(rotate,75000);
  console.info('[Seelary] random Pexels video-wall mix active. Tracked:',trackedVideos.size,'Pool:',VIDEO_POOL.length)
}

/* Do not touch the app's preload path. */
window.addEventListener('load',function(){setTimeout(activate,4500)},{once:true});
})();
