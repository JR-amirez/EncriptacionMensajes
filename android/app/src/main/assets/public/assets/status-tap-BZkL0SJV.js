import{r as a,a as i,w as c}from"./index-cTPhe-5z.js";import{f as d,s as l}from"./index8-DM7U4bXa.js";/*!
 * (C) Ionic http://ionicframework.com - MIT License
 */const p=()=>{const e=window;e.addEventListener("statusTap",()=>{a(()=>{const n=e.innerWidth,s=e.innerHeight,o=document.elementFromPoint(n/2,s/2);if(!o)return;const t=d(o);t&&new Promise(r=>i(t,r)).then(()=>{c(async()=>{t.style.setProperty("--overflow","hidden"),await l(t,300),t.style.removeProperty("--overflow")})})})})};export{p as startStatusTap};
