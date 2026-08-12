(function(){'use strict';
var COPY=Object.freeze({
'BUILD THE POST':'TURN SCROLLS INTO','PEOPLE SAVE.':'REAL CUSTOMERS.','STOP':'MAKE','THE SCROLL':'PEOPLE CARE',
'NEW CAMPAIGN DROP':'LAUNCH YOUR NEXT BIG THING','Swipe into the launch.':'CREATIVE • MEDIA • GROWTH',
'HOOK':'CREATE','PROOF':'TRUST','ACTION':'CONVERT','CAROUSEL THAT TEACHES + SELLS':'ONE CAMPAIGN. EVERY FORMAT.',
'SOCIAL PULSE':'TURN ATTENTION INTO SALES','LIVE CAMPAIGN PERFORMANCE':'CREATIVE THAT IMPROVES AS IT RUNS',
'COMMUNITY':'BUILD A BRAND PEOPLE JOIN','MORE SAVES':'MORE ACTION','SEELARY SOCIAL SYSTEM':'SEELARY GROWTH SYSTEM',
'48 HOUR DROP':'LAUNCH OFFER','20% OFF LAUNCH PACKAGE':'START YOUR CAMPAIGN TODAY','CLAIM OFFER':'START NOW',
'APP':'YOUR APP','PROMO':'DESERVES','THAT FEELS':'MORE','NATIVE.':'ATTENTION.',
'ENGAGEMENT':'REAL ACTION','REACTIONS • SAVES • SHARES • COMMENTS':'ATTENTION • INTEREST • ACTION • GROWTH',
'COLLAB':'CREATOR','CONTENT':'ADS','THAT SELLS':'THAT CONVERT'
});
function swap(v){return typeof v==='string'&&Object.prototype.hasOwnProperty.call(COPY,v)?COPY[v]:v}
function patch(proto,name){if(!proto||typeof proto[name]!=='function')return;var native=proto[name];if(native.__seelaryAdCopy)return;function wrapped(){var a=[].slice.call(arguments);a[0]=swap(a[0]);return native.apply(this,a)}wrapped.__seelaryAdCopy=true;proto[name]=wrapped}
patch(window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype,'fillText');
patch(window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype,'strokeText');
patch(window.OffscreenCanvasRenderingContext2D&&OffscreenCanvasRenderingContext2D.prototype,'fillText');
patch(window.OffscreenCanvasRenderingContext2D&&OffscreenCanvasRenderingContext2D.prototype,'strokeText');
window.__seelaryAdCopyLayer={active:true,version:'open-media-copy-v2',replacements:Object.keys(COPY).length};
document.write('<script src="./city-content.js"></'+'script><script src="./promo-social.js"></'+'script>');
})();