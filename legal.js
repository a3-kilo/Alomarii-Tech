(() => {
  'use strict';
  const bar=document.getElementById('legal-progress');
  const links=[...document.querySelectorAll('.legal-toc a[href^="#"]')];
  const sections=[...document.querySelectorAll('.legal-section[id]')];
  let raf=false;
  function refresh(){
    const max=document.documentElement.scrollHeight-innerHeight;
    if(bar)bar.style.transform=`scaleX(${max>0?Math.min(Math.max(scrollY/max,0),1):0})`;
    const current=sections.filter(s=>s.getBoundingClientRect().top<innerHeight*.34).at(-1);
    if(current)links.forEach(l=>l.classList.toggle('active',l.getAttribute('href')==='#'+current.id));
    raf=false;
  }
  addEventListener('scroll',()=>{if(!raf){requestAnimationFrame(refresh);raf=true;}},{passive:true});
  addEventListener('resize',refresh,{passive:true});
  refresh();
})();
