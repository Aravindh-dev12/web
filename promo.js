(function(){'use strict';
var COPY=Object.freeze({
'seelary.studio':'seelary.growth','growth.lab':'seelary.ads','creator.wave':'seelary.creators','launch.club':'seelary.launch','seelary.creative':'seelary.growth','seelary.reel':'seelary.growth','seelary.story':'seelary.launch','maya / creator':'maya × seelary','nora / founder':'nora × seelary','paid partnership':'seelary partnership','paid collaboration':'creator campaign',
'BUILD THE POST':'TURN SCROLLS INTO','PEOPLE SAVE.':'REAL CUSTOMERS.','LIKES':'SAVES','STOP':'MAKE','THE SCROLL':'PEOPLE CARE','Social creative built to move.':'Ads built to convert attention.','SEE CAMPAIGN':'START GROWING',
'NEW CAMPAIGN DROP':'LAUNCH YOUR NEXT BIG THING','Swipe into the launch.':'Creative, media, growth—together.','EXPLORE →':'START →',
'HOOK':'CREATE','PROOF':'TRUST','ACTION':'BUY','CAROUSEL THAT TEACHES + SELLS':'TURN EVERY SLIDE INTO DEMAND',
'“THIS ACTUALLY':'“WE FINALLY','MADE THE':'TURNED VIEWS','CAMPAIGN CLICK.”':'INTO SALES.”',
'NEW':'YOUR','PRODUCT':'NEXT','DROP':'LAUNCH','LAUNCH 08.12':'READY TO GROW',
'SOCIAL PULSE':'TURN ATTENTION INTO SALES','LIVE CAMPAIGN PERFORMANCE':'CREATIVE THAT IMPROVES AS IT RUNS',
'COMMUNITY':'BUILD A BRAND PEOPLE JOIN','BEFORE':'BEFORE SEELARY','AFTER':'WITH SEELARY','MORE SAVES':'MORE ACTION','SEELARY SOCIAL SYSTEM':'SEELARY GROWTH SYSTEM',
'48 HOUR DROP':'LIMITED LAUNCH OFFER','20% OFF LAUNCH PACKAGE':'START YOUR CAMPAIGN TODAY','SOCIAL CAMPAIGN KIT':'CREATIVE + MEDIA ENGINE','CREATIVE + MEDIA + TESTING':'BUILT TO FIND WHAT CONVERTS','CLAIM OFFER':'START NOW',
'APP':'YOUR APP','PROMO':'DESERVES','THAT FEELS':'BETTER','NATIVE.':'GROWTH.','SEELARY / SOCIAL PRODUCT MARKETING':'SEELARY / GROW YOUR APP WITH SOCIAL',
'“THE IDEA':'“GREAT ADS','TRAVELS.”':'GET SHARED.”','MIX VIDEO + CREATOR + CTA':'VIDEO + CREATORS + PERFORMANCE',
'“OUR BEST':'“WE TURNED','SOCIAL LAUNCH':'ATTENTION INTO','THIS YEAR.”':'REAL GROWTH.”',
'SHOP THE':'GROW YOUR','CAMPAIGN':'BRAND','GET IT':'START',
'#MAKEITMOVE':'#MAKEYOURBRANDMOVE','CREATOR CHALLENGE / LIVE':'CREATOR CAMPAIGNS THAT SCALE',
'REMIX':'TEST','POST':'LEARN','REPEAT':'SCALE','SEELARY TREND LAB':'SEELARY / BUILD WHAT PEOPLE SHARE',
'ENGAGEMENT':'REAL ACTION','REACTIONS • SAVES • SHARES • COMMENTS':'ATTENTION • INTEREST • ACTION • GROWTH',
'CREATOR × BRAND':'CREATOR × SEELARY','COLLAB':'CREATOR','CONTENT':'ADS','THAT SELLS':'THAT CONVERT',
'Campaign creative in motion':'Video ads built for action','NEW DROP / TAP TO EXPLORE':'LAUNCH FASTER / TAP TO START','OPEN →':'GROW →',
'SOCIAL DROP':'READY TO GROW?','Campaign Kit':'Creative + Media','$49':'NOW','SHOP':'START'
});
function swap(v){return typeof v==='string'&&Object.prototype.hasOwnProperty.call(COPY,v)?COPY[v]:v}
function patch(proto,name){if(!proto||typeof proto[name]!=='function')return;var native=proto[name];if(native.__seelaryAdCopy)return;function wrapped(){var a=[].slice.call(arguments);a[0]=swap(a[0]);return native.apply(this,a)}wrapped.__seelaryAdCopy=true;proto[name]=wrapped}
patch(window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype,'fillText');patch(window.CanvasRenderingContext2D&&CanvasRenderingContext2D.prototype,'strokeText');patch(window.OffscreenCanvasRenderingContext2D&&OffscreenCanvasRenderingContext2D.prototype,'fillText');patch(window.OffscreenCanvasRenderingContext2D&&OffscreenCanvasRenderingContext2D.prototype,'strokeText');
window.__seelaryAdCopyLayer={active:true,version:'social-ad-copy-v1',replacements:Object.keys(COPY).length};
document.write('<script src="./promo-social.js"><\\/script>');
})();
