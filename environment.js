/* Device-local time only. No location lookup, weather service or network. */
(() => {
  'use strict';
  if(!document.querySelector('#app'))return;
  const app=document.querySelector('#app'),select=document.querySelector('#sky-mode');
  const palettes={
    dawn:{dark:false,top:'#b8d2e4',mid:'#e7e5df',horizon:'#f1cdaa',water:'#afc3cc',cloud:.54},
    day:{dark:false,top:'#83b4d2',mid:'#c7e0ec',horizon:'#edf0e9',water:'#b9cbd2',cloud:.64},
    dusk:{dark:true,top:'#1c2c48',mid:'#665a78',horizon:'#ce9b9a',water:'#7d8eaa',cloud:.36},
    night:{dark:true,top:'#091628',mid:'#172c47',horizon:'#46536c',water:'#536f8b',cloud:.18}
  };
  const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  function phase(hour){return hour<5?'night':hour<8?'dawn':hour<17?'day':hour<20?'dusk':'night';}
  let state={},stamp='';
  function refresh(){
    const now=new Date(),hour=now.getHours()+now.getMinutes()/60,automatic=select.value==='auto',key=automatic?phase(hour):select.value;
    const p=palettes[key],next=key+':'+now.getHours()+':'+now.getMinutes();
    if(next===stamp)return;stamp=next;
    app.dataset.sky=key;app.dataset.theme=p.dark?'dusk':'dawn';
    for(const [name,value] of Object.entries(p))if(typeof value==='string')app.style.setProperty('--sky-'+name,value);
    app.style.setProperty('--cloud-opacity',String(p.cloud));
    app.style.setProperty('--sun-x',String(automatic?Math.max(12,Math.min(85,15+(hour-5)/15*70)):25)+'%');
    const text=(automatic?'Local time · ':'')+now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    document.querySelector('#local-time').textContent=text;
    state={key,dark:p.dark,top:rgb(p.top),horizon:rgb(p.horizon),water:rgb(p.water),cloud:p.cloud};
    document.dispatchEvent(new CustomEvent('portfolio:sky'));
  }
  // One cloud mask shared by the moving sky layers and water reflections.
  const mask=document.createElement('canvas');mask.width=1024;mask.height=256;
  const context=mask.getContext('2d');let seed=7919;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let group=0;group<6;group++){
    const cx=group*180+random()*45,cy=80+random()*85;
    for(let i=0;i<36;i++){
      const x=cx+(random()-.5)*210,y=cy+(random()-.5)*38,r=22+random()*47;
      context.save();context.translate(x,y);context.scale(1,.45+random()*.38);
      const g=context.createRadialGradient(0,0,0,0,0,r);g.addColorStop(0,'rgba(255,255,255,.10)');g.addColorStop(.5,'rgba(255,255,255,.055)');g.addColorStop(1,'rgba(255,255,255,0)');context.fillStyle=g;context.fillRect(-r,-r,r*2,r*2);context.restore();
    }
  }
  const image=mask.toDataURL('image/png');
  const clouds=document.querySelector('.clouds');
  for(let i=0;i<3;i++){const layer=document.createElement('div');layer.className='cloud-layer cloud-layer-'+i;layer.style.backgroundImage=`url("${image}")`;clouds.append(layer);}
  select.addEventListener('change',()=>{stamp='';refresh();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){stamp='';refresh();}});
  setInterval(()=>{if(!document.hidden)refresh();},60000);
  refresh();
  window.PortfolioEnvironment={get:()=>state,cloudMask:mask,phase};
})();
