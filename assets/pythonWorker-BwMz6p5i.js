(function(){"use strict";const h=t=>{var o;if(t==null)return"";const n=typeof t.toString=="function"?t.toString():String(t);return(o=t.destroy)==null||o.call(t),n==="None"?"":n};let a,r;function p(t){return a??(a=(async()=>{const{loadPyodide:n}=await import(new URL("pyodide.mjs",t).href);r=await n({indexURL:t})})()),a}self.onmessage=async t=>{const{id:n,code:o,indexURL:u}=t.data;try{await p(u);const s=[],d=e=>s.push(e);if(r.setStdout({batched:d}),r.setStderr({batched:d}),!String(o??"").trim()){self.postMessage({id:n,ok:!0,result:""});return}let g;try{g=await r.runPythonAsync(o)}catch(e){const f=s.join(`
`),y=(e==null?void 0:e.message)||String(e);throw new Error(f?`${f}
${y}`:y)}const i=s.join(`
`),c=h(g),w=c?i?`${i}
${c}`:c:i;self.postMessage({id:n,ok:!0,result:w})}catch(s){self.postMessage({id:n,ok:!1,error:(s==null?void 0:s.message)||String(s)})}}})();
