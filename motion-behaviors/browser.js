const token=(el,value)=>(el.dataset.behavior||"").split(/\s+/).includes(value);
export const durationToMs=(value)=>{
  if(typeof value==="number") return Math.max(0,value);
  if(!value) return 0;
  const match=/^([0-9]*\.?[0-9]+)(ms|s)$/.exec(value.trim());
  if(!match) throw new Error(`Invalid duration: ${value}`);
  return Number(match[1])*(match[2]==="s"?1000:1);
};
const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));

export class MotionBehaviors {
  constructor(config,root=document){
    this.config=config; this.root=root;
    this.selector=config.selector||'[data-behavior~="animate"]';
    this.groupAttribute=config.groupAttribute||"motionGroup";
    this.started=new WeakSet();
  }
  init(){
    const triggers=this.config.start??["page-loaded"];
    for(const trigger of triggers) this.bindTrigger(trigger);
    return this;
  }
  emit(name,detail){ window.dispatchEvent(new CustomEvent(name,{detail})); }
  async run(group="default"){
    const elements=this.elements(group);
    for(let index=0;index<elements.length;index++) await this.runElement(elements[index],index,elements.length,group);
  }
  async runElement(element,index=0,total=1,group=element.dataset.motionGroup||"default"){
    if(this.started.has(element)) return;
    this.started.add(element); this.dispatch("start",element,index,group);
    if(token(element,"el-in")){
      this.dispatch("enter",element,index,group);
      await this.animate(element,element.dataset.motionIn||this.config.in);
      this.dispatch("entered",element,index,group);
    }
    const isLast=token(element,"last")||index===total-1;
    const waitMs=durationToMs(element.dataset.motionWait??this.config.wait);
    if(!isLast&&token(element,"el-out")){
      if(waitMs>0){ this.dispatch("wait",element,index,group); await sleep(waitMs); }
      this.dispatch("exit",element,index,group);
      await this.animate(element,element.dataset.motionOut||this.config.out||this.config.in);
      this.dispatch("exited",element,index,group);
    }
    const finish=element.dataset.motionFinish||(isLast?this.config.lastFinish:this.config.finish)||(isLast?"visible":"hidden");
    this.applyFinish(element,finish); this.dispatch("finish",element,index,group);
    this.emit(`motion:finished:${element.id||index}`,{element,index,group});
  }
  reset(group){
    for(const el of this.elements(group)){
      this.started.delete(el); el.style.removeProperty("visibility"); el.style.removeProperty("display");
    }
  }
  elements(group){
    return Array.from(this.root.querySelectorAll(this.selector))
      .filter(el=>!group||(el.dataset[this.groupAttribute]||"default")===group);
  }
  bindTrigger(trigger){
    if(trigger==="page-loaded"){
      const start=()=>void this.run();
      if(document.readyState==="complete") queueMicrotask(start);
      else window.addEventListener("load",start,{once:true});
      return;
    }
    const [,kind,value]=trigger.match(/^([^:]+):(.+)$/)||[];
    if(!kind) return;
    if(kind==="click"){
      document.addEventListener("click",event=>{ if(event.target?.closest?.(value)) void this.run(); });
    } else if(kind==="event"){
      window.addEventListener(value,()=>void this.run());
    } else if(kind==="after"){
      window.addEventListener(`motion:finished:${value.replace(/^#/,"")}`,()=>void this.run());
    } else if(kind==="visible"){
      const target=document.querySelector(value); if(!target) return;
      const observer=new IntersectionObserver(entries=>{
        if(entries.some(entry=>entry.isIntersecting)){ void this.run(); observer.disconnect(); }
      });
      observer.observe(target);
    }
  }
  animate(element,animation){
    if(matchMedia("(prefers-reduced-motion: reduce)").matches) return Promise.resolve();
    return new Promise(resolve=>{
      const name=animation.startsWith("animate__")?animation:`animate__${animation}`;
      element.classList.add("animate__animated",name);
      element.addEventListener("animationend",()=>{
        element.classList.remove("animate__animated",name); resolve();
      },{once:true});
    });
  }
  applyFinish(element,finish){
    if(finish==="remove") element.remove();
    else if(finish==="hidden") element.style.visibility="hidden";
    else element.style.visibility="visible";
  }
  dispatch(phase,element,index,group){
    element.dispatchEvent(new CustomEvent(`motion:${phase}`,{detail:{element,index,group,phase},bubbles:true}));
  }
}
export const defineMotionBehavior=(config,root=document)=>new MotionBehaviors(config,root);
export const animate=(config,root=document)=>defineMotionBehavior(config,root).init();
