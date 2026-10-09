function r(n,e){if(!e||/[\\\t\r\n]/.test(n))return null;try{const t=new URL("https://"+n);return t.username||t.password?null:t.hostname.endsWith("."+e)||t.hostname===e?t:null}catch(t){return null}}export{r as getSafeRedirectUrl};
//# sourceMappingURL=enter-redirect-BWU8MClT.js.map
