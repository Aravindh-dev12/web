(function(){'use strict';
var COPY=Object.freeze({
'BUILD THE POST':'SEELARY CAMPAIGN','PEOPLE SAVE.':'CREATIVE THAT MOVES','STOP':'SEELARY','THE SCROLL':'CAMPAIGN FILM',
'NEW CAMPAIGN DROP':'SEELARY LAUNCH','Swipe into the launch.':'CREATIVE • MEDIA • GROWTH',
'HOOK':'CREATE','PROOF':'TRUST','ACTION':'GROW','CAROUSEL THAT TEACHES + SELLS':'SEELARY / CAMPAIGN SERIES',
'SOCIAL PULSE':'SEELARY / CAMPAIGN','LIVE CAMPAIGN PERFORMANCE':'CREATIVE • MEDIA • GROWTH',
'COMMUNITY':'SEELARY','MORE SAVES':'MORE IMPACT','SEELARY SOCIAL SYSTEM':'SEELARY GROWTH SYSTEM',
'48 HOUR DROP':'SEELARY LAUNCH','20% OFF LAUNCH PACKAGE':'CREATIVE • MEDIA • GROWTH','CLAIM OFFER':'START',
'APP':'SEELARY','PROMO':'PRODUCT','THAT FEELS':'CAMPAIGN','NATIVE.':'FILM.',
'ENGAGEMENT':'SEELARY','REACTIONS • SAVES • SHARES • COMMENTS':'CREATIVE • MEDIA • GROWTH',
'COLLAB':'SEELARY','CONTENT':'CAMPAIGN','THAT SELLS':'IN MOTION'
});
function swap(v){return typeof v==='string'&&Object.prototype.hasOwnProperty.call(COPY,v)?COPY[v]:v}
function patch(proto,name){if(!proto||typeof proto[name]!=='function')return;var native=proto[name];if(native.__seelaryContentOnly)return;function wrapped(){var a=[].slice.call(arguments);a[0]=swap(a[0]);return native.apply(this,a)}wrapped.__seelaryContentOnly=true;proto[name]=wrapped}
patch(window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype,'fillText');
patch(window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype,'strokeText');
patch(window.OffscreenCanvasRenderingContext2D&&OffscreenCanvasRenderingContext2D.prototype,'fillText');
patch(window.OffscreenCanvasRenderingContext2D&&OffscreenCanvasRenderingContext2D.prototype,'strokeText');
window.__seelaryAdCopyLayer={active:true,version:'content-only-v3',replacements:Object.keys(COPY).length};
document.write('<script src="./promo-social.js"></'+'script>');
})();