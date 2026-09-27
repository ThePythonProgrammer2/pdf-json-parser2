var te=Object.defineProperty;var ne=(n,t)=>()=>(n&&(t=n(n=0)),t);var re=(n,t)=>{for(var e in t)te(n,e,{get:t[e],enumerable:true});};var U={};re(U,{renderPdfToImages:()=>K});async function K(n,t){let e;try{e=(await import('unpdf')).getDocumentProxy;}catch{throw new Error("unpdf is required for PDF processing. Install it: npm install unpdf")}let r=t?.scale??2,s=n instanceof ArrayBuffer?new Uint8Array(n):n,o=await e(s),i=[];for(let a=1;a<=o.numPages;a++){let c=await o.getPage(a),l=c.getViewport({scale:r}),g;if(typeof OffscreenCanvas<"u")g=new OffscreenCanvas(l.width,l.height);else if(typeof document<"u")g=document.createElement("canvas"),g.width=l.width,g.height=l.height;else throw new Error("No canvas support available. PDF rendering requires a browser environment.");let d=g.getContext("2d");if(!d)throw new Error("Could not get canvas 2d context");await c.render({canvasContext:d,viewport:l}).promise;let m;if(g instanceof OffscreenCanvas){let p=await g.convertToBlob({type:"image/png"});m=await de(p);}else m=g.toDataURL("image/png");i.push({pageNumber:a,dataUrl:m,width:l.width,height:l.height});}return i}function de(n){return new Promise((t,e)=>{let r=new FileReader;r.onload=()=>t(r.result),r.onerror=()=>e(new Error("Failed to read blob")),r.readAsDataURL(n);})}var $=ne(()=>{});function M(n){return {all:n=n||new Map,on:function(t,e){var r=n.get(t);r?r.push(e):n.set(t,[e]);},off:function(t,e){var r=n.get(t);r&&(e?r.splice(r.indexOf(e)>>>0,1):n.set(t,[]));},emit:function(t,e){var r=n.get(t);r&&r.slice().map(function(s){s(e);}),(r=n.get("*"))&&r.slice().map(function(s){s(t,e);});}}}var T=class{emitter;constructor(){this.emitter=M();}on(t,e){return this.emitter.on(t,e),this}off(t,e){return this.emitter.off(t,e),this}emit(t,e){return this.emitter.emit(t,e),this}once(t,e){let r=(s=>{this.off(t,r),e(s);});return this.on(t,r)}onAny(t){return this.emitter.on("*",t),this}offAny(t){if(t)this.emitter.off("*",t);else {let e=this.emitter.all.get("*");e&&(e.length=0);}return this}removeAllListeners(t){return t!==void 0?this.emitter.off(t):this.emitter.all.clear(),this}listeners(t){return this.emitter.all.get(t)||[]}listenerCount(t){return this.listeners(t).length}hasListeners(t){return this.listenerCount(t)>0}eventNames(){return Array.from(this.emitter.all.keys())}addListener(t,e){return this.on(t,e)}removeListener(t,e){return this.off(t,e)}getRawEmitter(){return this.emitter}};function se(n){return {success:true,data:n}}function oe(n){return {success:false,error:n}}async function A(n){try{let t=await n();return se(t)}catch(t){return oe(t)}}async function E(){return caches.delete("hf-model-cache")}async function k(){let n=await caches.open("hf-model-cache"),t=await n.keys(),e=0;for(let r of t){let s=await n.match(r);if(s){let o=await s.blob();e+=o.size;}}return e}var D=0;function L(){return `#/texts/${D++}`}function ie(){D=0;}function N(n){let t=/<loc_(\d+)>/g,e=[...n.matchAll(t)],r=n.replace(t,"").trim();if(e.length>=4){let s=e.slice(0,4).map(o=>Number.parseInt(o[1]??"0",10)/1e3);return {bbox:{l:s[0]??0,t:s[1]??0,r:s[2]??0,b:s[3]??0,coord_origin:"TOPLEFT"},cleanContent:r}}return {bbox:null,cleanContent:r}}function ae(n,t=1){return n?[{page_no:t,bbox:n,charspan:[0,0]}]:[]}function ce(n){let t=n.trim().split(/<nl>/).filter(o=>o.length>0),e=[],r=0,s=/<(ched|rhed|srow|fcel|ecel|ucel|lcel|xcel)>/g;return t.forEach((o,i)=>{let a=[],c=0,l=o.split(s);for(let g=1;g<l.length;g+=2){let d=l[g],m=(l[g+1]??"").trim(),p=d==="ched"||d==="rhed"||d==="srow";switch(d){case "lcel":{let h=a[a.length-1];h&&(h.col_span=(h.col_span||1)+1),c++;break}case "ucel":{let h=e[i-1]?.[c];i>0&&h&&(h.row_span=(h.row_span||1)+1),c++;break}case "xcel":c++;break;default:a.push({text:m,row_span:1,col_span:1,start_row_offset_idx:i,end_row_offset_idx:i+1,start_col_offset_idx:c,end_col_offset_idx:c+1,col_header:p&&d==="ched",row_header:p&&(d==="rhed"||d==="srow")}),c++;break}}r=Math.max(r,c),e.push(a);}),{num_rows:e.length,num_cols:r,table_cells:e.flat()}}function le(n){let t=/<([a-z_0-9]+)>([\s\S]*?)<\/\1>/,e=n.match(t);return e?{tagName:e[1]??"",content:e[2]??"",fullMatch:e[0]}:null}function b(n,t,e){let r=L(),s={self_ref:r,parent:{$ref:"#/body"},children:[],label:t,prov:n.prov,orig:n.cleanContent,text:n.cleanContent,...e};n.texts.push(s),n.bodyChildren.push({$ref:r});}function v(n){let t=Number.parseInt(n.tag.tagName.slice(-1),10)+1;b(n,"section_header",{level:t});}function w(n){b(n,n.tag.tagName);}function S(n){let t=n.tag.content.match(/<caption>([\s\S]*?)<\/caption>/),e=t?t[1]?.replace(/<loc_\d+>/g,"").trim():void 0,r=`#/pictures/${n.pictures.length}`,s={self_ref:r,parent:{$ref:"#/body"},children:[],label:n.tag.tagName==="chart"?"chart":"picture",prov:n.prov,caption:e};n.pictures.push(s),n.bodyChildren.push({$ref:r});}function H(n){let t=/<list_item>([\s\S]*?)<\/list_item>/g;for(let e=t.exec(n.tag.content);e!==null;e=t.exec(n.tag.content)){let{cleanContent:r}=N(e[1]??""),s=r.replace(/^[·\-]\s*/,"").trim(),o=L(),i={self_ref:o,parent:{$ref:"#/body"},children:[],label:"list_item",prov:[],orig:s,text:s,enumerated:n.tag.tagName==="ordered_list"};n.texts.push(i),n.bodyChildren.push({$ref:o});}}var ge={doctag:n=>O(n.tag.content,n.texts,n.tables,n.pictures,n.bodyChildren),document:n=>O(n.tag.content,n.texts,n.tables,n.pictures,n.bodyChildren),title:n=>b(n,"title"),section_header_level_0:v,section_header_level_1:v,section_header_level_2:v,section_header_level_3:v,section_header_level_4:v,section_header_level_5:v,text:n=>b(n,"text"),paragraph:n=>b(n,"text"),code:n=>{let t=n.cleanContent.match(/<_([^_]+)_>/),e=t?t[1]:void 0,r=n.cleanContent.replace(/<_[^_]+_>/,"").trim();b(n,"code",{orig:r,text:r,language:e});},formula:n=>b(n,"formula"),otsl:n=>{let t=ce(n.tag.content),e=`#/tables/${n.tables.length}`,r={self_ref:e,parent:{$ref:"#/body"},children:[],label:"table",prov:n.prov,data:t};n.tables.push(r),n.bodyChildren.push({$ref:e});},picture:S,chart:S,ordered_list:H,unordered_list:H,caption:w,footnote:w,page_header:w,page_footer:w};function O(n,t,e,r,s){let o=n;for(;o.length>0;){let i=le(o);if(!i)break;let a=o.indexOf(i.fullMatch);o=o.slice(a+i.fullMatch.length);let{bbox:c,cleanContent:l}=N(i.content),g=ae(c),d={tag:i,cleanContent:l,prov:g,texts:t,tables:e,pictures:r,bodyChildren:s},m=ge[i.tagName];m?m(d):l?.trim()&&b(d,"text");}}function R(n,t="document"){ie();let e=[],r=[],s=[],o=[];return O(n,e,r,s,o),{schema_name:"DoclingDocument",version:"1.0.0",name:t,texts:e,tables:r,pictures:s,body:{self_ref:"#/body",parent:null,children:o,label:"body"},pages:{1:{size:{width:612,height:792}}}}}var x=class{type="web";config;events=new T;worker=null;isReady=false;isProcessing=false;constructor(t){this.config={device:"webgpu",modelId:"onnx-community/granite-docling-258M-ONNX",maxNewTokens:4096,...t};}get ready(){return this.isReady}get processing(){return this.isProcessing}async initialize(){if(!this.isReady){if(this.worker)throw new Error("Initialization already in progress");return new Promise((t,e)=>{let r=this.config.workerUrl??this.createWorkerBlobUrl();this.worker=new Worker(r,{type:"module"});let s={PROGRESS:i=>{this.events.emit("loading",{progress:i.progress,status:i.status});},READY:()=>{this.isReady=true,this.events.emit("ready",void 0),t();},ERROR:i=>{let a={message:i.error};this.events.emit("error",a),this.isReady||e(new Error(i.error));}},o=i=>{let a=s[i.data.type];a?.(i.data);};this.worker.addEventListener("message",o),this.worker.addEventListener("error",i=>{let a={message:i.message||"Worker error"};this.events.emit("error",a),e(new Error(a.message));}),this.worker.postMessage({type:"INIT",config:this.config});})}}destroy(){this.worker&&(this.worker.terminate(),this.worker=null),this.isReady=false,this.isProcessing=false,this.events.removeAllListeners();}on(t,e){return this.events.on(t,e),this}off(t,e){return this.events.off(t,e),this}async clearCache(){return E()}async getCacheSize(){return k()}async processImage(t,e){if(!this.worker||!this.isReady)throw new Error("Client not initialized. Call initialize() first.");if(this.isProcessing)throw new Error("Already processing an image. Wait for completion.");this.isProcessing=true;try{let r=await this.imageInputToDataUrl(t);return await new Promise((s,o)=>{let i={REPORT:c=>{this.events.emit("status",{status:c.status});},STREAM:c=>{this.events.emit("stream",{chunk:c.chunk,progress:c.progress});},DONE:c=>{this.isProcessing=!1;let l={raw:c.text,html:c.html,markdown:c.markdown,plainText:c.plainText,json:c.json,tables:c.tables,overlays:c.overlays};this.events.emit("complete",l),this.worker?.removeEventListener("message",a),s(l);},ERROR:c=>{this.isProcessing=!1;let l={message:c.error};this.events.emit("error",l),this.worker?.removeEventListener("message",a),o(new Error(c.error));}},a=c=>{let l=i[c.data.type];l?.(c.data);};this.worker?.addEventListener("message",a),this.worker?.postMessage({type:"PROCESS_FILE",src:r,maxNewTokens:e?.maxNewTokens??this.config.maxNewTokens});})}catch(r){throw this.isProcessing=false,r}}async convert(t,e,r){await this.ensureInitialized();let s=await this.processFilePages(t,e);return this.combineResults(s,e,r)}async extractText(t,e,r){return this.convert(t,e,{...r,to_formats:["text"]})}async toHtml(t,e,r){return this.convert(t,e,{...r,to_formats:["html"]})}async toMarkdown(t,e,r){return this.convert(t,e,{...r,to_formats:["md"]})}async convertDocument(t,e,r){return this.convert(t,e,r)}async process(t,e,r){return this.convert(t,e,r)}async convertToFile(t,e,r){throw new Error("convertToFile is not supported by the web client. Use convert() instead.")}async safeConvert(t,e,r){return A(()=>this.convert(t,e,r))}async safeConvertToFile(t,e,r){throw new Error("safeConvertToFile is not supported by the web client.")}async ensureInitialized(){this.isReady||await this.initialize();}createWorkerBlobUrl(){let t=["self.postMessage||0;","const m='docling-sdk/web/worker';","Function('m','return import(m)')(m).catch(err=>{","  self.postMessage({type:'ERROR',error:err.message});","});"].join(""),e=new Blob([t],{type:"application/javascript"});return URL.createObjectURL(e)}async processFilePages(t,e){let r=e.split(".").pop()?.toLowerCase();if(r==="pdf"){let i=typeof t=="string"?this.base64ToUint8Array(t):t,{renderPdfToImages:a}=await Promise.resolve().then(()=>($(),U)),c=await a(i),l=[];for(let g of c)l.push(await this.processImage(g.dataUrl));return l}if(typeof t=="string"){let i=t.startsWith("data:")?t:`data:image/${r};base64,${t}`;return [await this.processImage(i)]}let o=new Blob([t],{type:`image/${r||"png"}`});return [await this.processImage(o)]}combineResults(t,e,r){let s=t.map(l=>l.raw).join(`

`),o=t.map(l=>l.markdown).join(`

---

`),i=t.map(l=>l.plainText).join(`

`),a=t.map(l=>l.html).join(`
`),c=t.length===1?t[0]?.json:R(s,e);return {document:{md_content:o,html_content:a,text_content:i,json_content:c,doc_tags:s},errors:[],timings:{total:0}}}async imageInputToDataUrl(t){if(typeof t=="string"){if(t.startsWith("data:"))return t;let r=await(await fetch(t)).blob();return this.blobToDataUrl(r)}if(t instanceof Blob)return this.blobToDataUrl(t);if(typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement)return t.toDataURL("image/png");if(typeof OffscreenCanvas<"u"&&t instanceof OffscreenCanvas){let e=await t.convertToBlob({type:"image/png"});return this.blobToDataUrl(e)}if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement){let e=document.createElement("canvas");e.width=t.naturalWidth||t.width,e.height=t.naturalHeight||t.height;let r=e.getContext("2d");if(!r)throw new Error("Could not get canvas context");return r.drawImage(t,0,0),e.toDataURL("image/png")}if(typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=document.createElement("canvas");e.width=t.width,e.height=t.height;let r=e.getContext("2d");if(!r)throw new Error("Could not get canvas context");return r.drawImage(t,0,0),e.toDataURL("image/png")}throw new Error("Unsupported image input type")}blobToDataUrl(t){return new Promise((e,r)=>{let s=new FileReader;s.onload=()=>e(s.result),s.onerror=()=>r(new Error("Failed to read blob")),s.readAsDataURL(t);})}base64ToUint8Array(t){let e=atob(t),r=new Uint8Array(e.length);for(let s=0;s<e.length;s++)r[s]=e.charCodeAt(s);return r}};var _=class{simpleTagMap;selfClosingTagMap;TABLE_TAG_CONFIG;TABLE_TAG_REGEX;combinedTagRegex;startTagOverrides;inlineTagConverters;tagConverters;constructor(){this.simpleTagMap={doctag:"div",document:"div",ordered_list:"ol",unordered_list:"ul",list_item:"li",caption:"figcaption",footnote:"sup",formula:"div",page_footer:"footer",page_header:"header",picture:"figure",chart:"figure",table:"table",otsl:"table",text:"p",paragraph:"p",title:"h1",document_index:"div",form:"form",key_value_region:"dl",reference:"a",smiles:"span"},this.selfClosingTagMap={checkbox_selected:'<input type="checkbox" checked disabled>',checkbox_unselected:'<input type="checkbox" disabled>',page_break:'<hr class="page-break">'},this.TABLE_TAG_CONFIG={"<ched>":{htmlTag:"th"},"<rhed>":{htmlTag:"th",scope:"row"},"<srow>":{htmlTag:"th",scope:"row"},"<fcel>":{htmlTag:"td"},"<ecel>":{htmlTag:"td"},"<ucel>":{htmlTag:"td"},"<lcel>":{htmlTag:"td"},"<xcel>":{htmlTag:"td"}},this.TABLE_TAG_REGEX=new RegExp(`(${Object.keys(this.TABLE_TAG_CONFIG).join("|")})`),this.startTagOverrides={doctag:'<div class="docling-document">',document:'<div class="docling-document">',formula:'<div class="formula">',document_index:'<div class="toc">',smiles:'<span class="smiles">',reference:'<a href="#">'},this.tagConverters={code:e=>this.convertBlockCode(e),otsl:e=>this.convertTable(e),picture:e=>this.convertPictureOrChart("picture",e),chart:e=>this.convertPictureOrChart("chart",e),inline:e=>this.convertInlineContent(e)};for(let e=0;e<=5;e++)this.tagConverters[`section_header_level_${e}`]=r=>{let s=e+1;return `<h${s}>${this.processTags(r)}</h${s}>`};this.inlineTagConverters={code:e=>{let r=/<_(.*?)_>/,s=e.match(r);if(s?.[1]){let o=this.sanitizeLanguageName(s[1]),i=e.replace(r,"").trim(),a=this.escapeHtml(i);return `<code${o!=="unknown"?` class="language-${o}"`:""}>${a}</code>`}return `<code>${this.escapeHtml(e)}</code>`},formula:e=>`<span class="formula">${this.escapeHtml(e)}</span>`,smiles:e=>`<span class="smiles">${this.escapeHtml(e)}</span>`,text:e=>this.escapeHtml(e)};let t=Object.keys(this.selfClosingTagMap).join("|");this.combinedTagRegex=new RegExp(`(<([a-z_0-9]+)>(.*?)<\\/\\2>)|(<(${t})>)`,"s");}escapeHtml(t){return t?t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}convert(t){let e=` ${t} `;return e=this.cleanupMetadataTokens(e),e=this.processTags(e),e.trim()}processTags(t){let e=t,r="";for(;e.length>0;){let s=e.match(this.combinedTagRegex);if(s&&typeof s.index=="number"){let o=e.substring(0,s.index);r+=this.escapeHtml(o);let i=s[0],a=s[2],c=s[3],l=s[5];a!==void 0?r+=this.convertSingleTag(a,c??""):l!==void 0&&(r+=this.selfClosingTagMap[l]??""),e=e.substring(s.index+i.length);}else {r+=this.escapeHtml(e);break}}return r}convertSingleTag(t,e){let r=t==="list_item"?e.trim().replace(/^[·-]\s*/g,""):e,s=this.tagConverters[t];if(s)return s(r);let o=this.simpleTagMap[t];if(o){let i=this.processTags(r);return `${this.getStartTag(t,o)}${i}</${o}>`}return this.escapeHtml(`<${t}>${r}</${t}>`)}getStartTag(t,e){return this.startTagOverrides[t]??`<${e}>`}convertInlineContent(t){let e=/<(code|formula|text|smiles)>(.*?)<\/\1>/s,r=t,s="";for(;r.length>0;){let o=r.match(e);if(o&&typeof o.index=="number"){let i=r.substring(0,o.index);s+=this.escapeHtml(i);let[a,c,l]=o,g=this.inlineTagConverters[c??""];g&&(s+=g(l??"")),r=r.substring(o.index+a.length);}else {s+=this.escapeHtml(r);break}}return s}convertBlockCode(t){let e=/<_(.*?)_>/,r=t.match(e),s="unknown",o=t;r?.[1]&&(s=this.sanitizeLanguageName(r[1]),o=t.replace(e,"").trim());let i=this.escapeHtml(o);return `<pre><code${s!=="unknown"?` class="language-${s}"`:""}>${i}</code></pre>`}convertTable(t){let e=t.trim().split(/<nl>/).filter(o=>o.length>0),r=[];return e.forEach((o,i)=>{let a=o.split(this.TABLE_TAG_REGEX),c=[],l=0;for(let g=1;g<a.length;g+=2){let d=a[g],m=a[g+1]??"";switch(d){case "<lcel>":{let p=c[c.length-1];p&&p.colspan++;break}case "<ucel>":{let p=r[i-1]?.[l];i>0&&p&&p.rowspan++,l++;break}case "<xcel>":{let p=c[c.length-1];p&&p.colspan++;break}default:d&&this.TABLE_TAG_CONFIG[d]&&(c.push({content:m,tag:d,colspan:1,rowspan:1}),l++);break}}r.push(c);}),`<table><tbody>${r.map(o=>`<tr>${o.map(a=>{let c=this.TABLE_TAG_CONFIG[a.tag];if(!c)return "";let l=[];a.colspan>1&&l.push(`colspan="${a.colspan}"`),a.rowspan>1&&l.push(`rowspan="${a.rowspan}"`),c.scope&&l.push(`scope="${c.scope}"`);let g=this.processTags(a.content),d=l.length>0?` ${l.join(" ")}`:"";return `<${c.htmlTag}${d}>${g}</${c.htmlTag}>`}).join("")}</tr>`).join("")}</tbody></table>`}convertPictureOrChart(t,e){if(/<(fcel|ched|rhed)>/.test(e)){let m=e.replace(/<[a-z_]+>/g,p=>p.startsWith("<fcel")||p.startsWith("<ched")||p.startsWith("<rhed")||p.startsWith("<nl")?p:"");return this.convertTable(m)}let r="",s=/<caption>(.*?)<\/caption>/s,o=e.match(s);o?.[1]&&(r=`<figcaption>${this.processTags(o[1])}</figcaption>`);let i=e.replace(s,""),a=/<([a-z_]+)>/,c=i.match(a),l=t;c&&(l=c[1]?.replace(/_/g," ")??t);let g=`<img alt="${this.escapeHtml(l)}" src="">`,d=this.simpleTagMap[t]??"figure";return `<${d}>${g}${r}</${d}>`}sanitizeLanguageName(t){let e=t.toLowerCase();return {"c#":"csharp","c++":"cpp",objectivec:"objective-c",visualbasic:"vb",javascript:"js",typescript:"ts",python:"py",ruby:"rb",dockerfile:"docker"}[e]??e.replace(/[\s#+]/g,"-")}cleanupMetadataTokens(t){return t.replace(/<loc_[0-9]+>/g,"")}};function j(n){return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.23/dist/katex.min.css" integrity="sha384-//SZkxyB7axjCAopkAL1E1rve+ZSPKapD89Lo/lLhcsXR+zOYl5z6zJZEFXil+q0" crossorigin="anonymous">

    <style>
        html {
            background-color: #f5f5f5;
            font-family: Arial, sans-serif;
            line-height: 1.6;
        }
        header, footer {
            text-align: center;
            margin-bottom: 1rem;
            font-size: 1em;
        }
        body {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background-color: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1, h2, h3, h4, h5, h6 {
            color: #333;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }
        h1 {
            font-size: 2em;
            border-bottom: 1px solid #eee;
            padding-bottom: 0.3em;
        }
        table {
            border-collapse: collapse;
            margin: 1em 0;
            width: 100%;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        figure {
            margin: 1.5em 0;
            text-align: center;
        }
        figcaption {
            color: #666;
            font-style: italic;
            margin-top: 0.5em;
        }
        img {
            max-width: 100%;
            height: auto;
        }
        pre {
            background-color: #f6f8fa;
            border-radius: 3px;
            padding: 1em;
            overflow: auto;
        }
        code {
            font-family: monospace;
            background-color: #f6f8fa;
            padding: 0.2em 0.4em;
            border-radius: 3px;
        }
        pre code {
            background-color: transparent;
            padding: 0;
        }
        .formula {
            text-align: center;
            padding: 0.5em;
            margin: 1em 0;
        }
        .formula:not(:has(.katex)) {
            color: transparent;
        }
        .page-break {
            page-break-after: always;
            border-top: 1px dashed #ccc;
            margin: 2em 0;
        }
        .key-value-region {
            background-color: #f9f9f9;
            padding: 1em;
            border-radius: 4px;
            margin: 1em 0;
        }
        .key-value-region dt {
            font-weight: bold;
        }
        .key-value-region dd {
            margin-left: 1em;
            margin-bottom: 0.5em;
        }
        .form-container {
            border: 1px solid #ddd;
            padding: 1em;
            border-radius: 4px;
            margin: 1em 0;
        }
        .form-item {
            margin-bottom: 0.5em;
        }
    </style>
    </head>
<body>
${new _().convert(n)}
<script type="module">
import katex from 'https://cdn.jsdelivr.net/npm/katex@0.16.23/dist/katex.mjs';
import renderMathInElement from "https://cdn.jsdelivr.net/npm/katex@0.16.23/dist/contrib/auto-render.mjs";

const mathElements = document.querySelectorAll('.formula');
for (let element of mathElements) {
    katex.render(element.textContent, element, {
        throwOnError: false,
    });
}

renderMathInElement(document.body, {
    delimiters: [
        {left: "$$", right: "$$", display: true},
        {left: "\\\\[", right: "\\\\]", display: true},
        {left: "$", right: "$", display: false},
        {left: "\\\\(", right: "\\\\)", display: false}
    ],
    throwOnError : false,
});
  <\/script>
</body>
</html>`}var pe=new Set(["lcel","ucel","xcel"]);function u(n){return n.replace(/<loc_\d+>/g,"").trim()}function me(n){let t=n.trim().split(/<nl>/).filter(a=>a.length>0);if(t.length===0)return "";let e=/<(ched|rhed|srow|fcel|ecel|ucel|lcel|xcel)>/g,r=[],s=0;for(let a of t){let c=[],l=a.split(e);for(let g=1;g<l.length;g+=2){let d=l[g],m=u(l[g+1]??"");c.push(pe.has(d??"")?"":m);}s=Math.max(s,c.length),r.push(c);}if(r.length===0||s===0)return "";for(let a of r)for(;a.length<s;)a.push("");let o=[],i=r[0]??[];o.push(`| ${i.map(a=>a.replace(/\|/g,"\\|")).join(" | ")} |`),o.push(`| ${i.map(()=>"---").join(" | ")} |`);for(let a=1;a<r.length;a++){let c=r[a]??[];o.push(`| ${c.map(l=>l.replace(/\|/g,"\\|")).join(" | ")} |`);}return o.join(`
`)}var he={code:n=>`\`${n}\``,formula:n=>`$${n}$`,smiles:n=>`\`${n}\``,text:n=>n};function ue(n){let t=/<(code|formula|text|smiles)>([\s\S]*?)<\/\1>/g,e="",r=0;for(let s=t.exec(n);s!==null;s=t.exec(n)){let o=n.slice(r,s.index);e+=u(o);let[,i,a]=s,c=u(a??""),l=he[i??""];e+=l?l(c):c,r=s.index+s[0].length;}return e+=u(n.slice(r)),e}function fe(n,t){let e=t.match(/<_([^_]+)_>/),r=e?e[1]:"",s=u(t.replace(/<_[^_]+_>/,"")).trim();return `\`\`\`${r}
${s}
\`\`\`

`}function be(n,t,e){return e.includes(`
`)||e.length>50?`$$
${e}
$$

`:`$${e}$

`}function ve(n,t){let e=[],r=/<list_item>([\s\S]*?)<\/list_item>/g,s=1;for(let o=r.exec(t);o!==null;o=r.exec(t)){let i=u(o[1]??"").replace(/^[·\-]\s*/,"").trim();e.push(`${s}. ${i}`),s++;}return `${e.join(`
`)}

`}function Ce(n,t){let e=[],r=/<list_item>([\s\S]*?)<\/list_item>/g;for(let s=r.exec(t);s!==null;s=r.exec(t)){let o=u(s[1]??"").replace(/^[·\-]\s*/,"").trim();e.push(`- ${o}`);}return `${e.join(`
`)}

`}function F(n,t){let e=t.match(/<caption>([\s\S]*?)<\/caption>/);return `![${e?u(e[1]??""):n}]()

`}var B=(n,t,e)=>`${e}

`,xe={doctag:(n,t)=>W(t),document:(n,t)=>W(t),title:(n,t,e)=>`# ${e}

`,section_header_level_0:(n,t,e)=>`## ${e}

`,section_header_level_1:(n,t,e)=>`### ${e}

`,section_header_level_2:(n,t,e)=>`#### ${e}

`,section_header_level_3:(n,t,e)=>`##### ${e}

`,section_header_level_4:(n,t,e)=>`###### ${e}

`,section_header_level_5:(n,t,e)=>`###### ${e}

`,text:B,paragraph:B,code:fe,formula:be,otsl:(n,t)=>`${me(t)}

`,picture:F,chart:F,ordered_list:ve,unordered_list:Ce,list_item:(n,t,e)=>`- ${e.replace(/^[·\-]\s*/,"").trim()}
`,caption:(n,t,e)=>`*${e}*

`,footnote:(n,t,e)=>`[^note]: ${e}

`,page_header:()=>"",page_footer:()=>"",page_break:()=>`
---

`,checkbox_selected:()=>"- [x] ",checkbox_unselected:()=>"- [ ] ",inline:(n,t)=>ue(t)};function _e(n,t){let e=u(t),r=xe[n];return r?r(n,t,e):e?`${e}

`:""}function W(n){let t="",e=n,r=/<([a-z_0-9]+)>([\s\S]*?)<\/\1>/;for(;e.length>0;){let s=e.match(r);if(s&&s.index!==void 0){let o=e.slice(0,s.index),i=u(o);i.trim()&&(t+=`${i}

`),t+=_e(s[1]??"",s[2]??""),e=e.slice(s.index+s[0].length);}else {let o=u(e);o.trim()&&(t+=`${o}

`);break}}return t.replace(/\n{3,}/g,`

`).trim()}function z(n){return W(n)}var ye=new Set(["lcel","ucel","xcel"]);function f(n){return n.replace(/<loc_\d+>/g,"").trim()}function Te(n){let t=n.trim().split(/<nl>/).filter(o=>o.length>0);if(t.length===0)return "";let e=/<(ched|rhed|srow|fcel|ecel|ucel|lcel|xcel)>/g,r=[],s=0;for(let o of t){let i=[],a=o.split(e);for(let c=1;c<a.length;c+=2){let l=a[c],g=f(a[c+1]??"");i.push(ye.has(l??"")?"":g);}s=Math.max(s,i.length),r.push(i);}if(r.length===0||s===0)return "";for(let o of r)for(;o.length<s;)o.push("");return r.map(o=>o.join("	")).join(`
`)}function we(n){let t=/<(code|formula|text|smiles)>([\s\S]*?)<\/\1>/g,e="",r=0;for(let s=t.exec(n);s!==null;s=t.exec(n)){let o=n.slice(r,s.index);e+=f(o);let[,,i]=s;e+=f(i??""),r=s.index+s[0].length;}return e+=f(n.slice(r)),e}function Re(n,t){return `${f(t.replace(/<_[^_]+_>/,"")).trim().split(`
`).map(s=>`    ${s}`).join(`
`)}

`}function Ee(n,t){let e=[],r=/<list_item>([\s\S]*?)<\/list_item>/g,s=1;for(let o=r.exec(t);o!==null;o=r.exec(t)){let i=f(o[1]??"").replace(/^[·\-]\s*/,"").trim();e.push(`${s}. ${i}`),s++;}return `${e.join(`
`)}

`}function ke(n,t){let e=[],r=/<list_item>([\s\S]*?)<\/list_item>/g;for(let s=r.exec(t);s!==null;s=r.exec(t)){let o=f(s[1]??"").replace(/^[·\-]\s*/,"").trim();e.push(`* ${o}`);}return `${e.join(`
`)}

`}function G(n,t){let e=t.match(/<caption>([\s\S]*?)<\/caption>/);return `[${e?f(e[1]??""):`[${n}]`}]

`}var C=(n,t,e)=>`${e}
${"-".repeat(Math.min(e.length,40))}

`,J=(n,t,e)=>`${e}

`,Oe={doctag:(n,t)=>I(t),document:(n,t)=>I(t),title:(n,t,e)=>`${e}
${"=".repeat(Math.min(e.length,50))}

`,section_header_level_0:C,section_header_level_1:C,section_header_level_2:C,section_header_level_3:C,section_header_level_4:C,section_header_level_5:C,text:J,paragraph:J,code:Re,formula:(n,t,e)=>`${e}

`,otsl:(n,t)=>`${Te(t)}

`,picture:G,chart:G,ordered_list:Ee,unordered_list:ke,list_item:(n,t,e)=>`* ${e.replace(/^[·\-]\s*/,"").trim()}
`,caption:(n,t,e)=>`[${e}]

`,footnote:(n,t,e)=>`[Note: ${e}]

`,page_header:()=>"",page_footer:()=>"",page_break:()=>`
${"\u2500".repeat(40)}

`,checkbox_selected:()=>"[X] ",checkbox_unselected:()=>"[ ] ",inline:(n,t)=>we(t),reference:(n,t,e)=>e,smiles:(n,t,e)=>e};function $e(n,t){let e=f(t),r=Oe[n];return r?r(n,t,e):e?`${e}

`:""}function I(n){let t="",e=n,r=/<([a-z_0-9]+)>([\s\S]*?)<\/\1>/;for(;e.length>0;){let s=e.match(r);if(s&&s.index!==void 0){let o=e.slice(0,s.index),i=f(o);i.trim()&&(t+=`${i}

`),t+=$e(s[1]??"",s[2]??""),e=e.slice(s.index+s[0].length);}else {let o=f(e);o.trim()&&(t+=`${o}

`);break}}return t.replace(/\n{3,}/g,`

`).trim()}function V(n){return I(n)}var We=new Set(["lcel","ucel","xcel"]);function Ie(n){return n.replace(/<loc_\d+>/g,"").trim()}function X(n){let t=n.trim().split(/<nl>/).filter(l=>l.length>0),e=/<(ched|rhed|srow|fcel|ecel|ucel|lcel|xcel)>/g,r=[],s=new Set,o=0;t.forEach((l,g)=>{let d=[],m=l.split(e),p=false;for(let h=1;h<m.length;h+=2){let y=m[h],ee=Ie(m[h+1]??"");(y==="ched"||y==="rhed"||y==="srow")&&(p=true),d.push(We.has(y??"")?"":ee);}p&&s.add(g),o=Math.max(o,d.length),r.push(d);});for(let l of r)for(;l.length<o;)l.push("");let i=[],a=[];if(s.size>0){let l=0;for(let g=0;g<r.length&&s.has(g);g++)l=g+1;i=r.slice(0,l),a=r.slice(l);}else r.length>0&&(i=[r[0]??[]],a=r.slice(1));return {headers:(i.length>0?(i[0]??[]).map((l,g)=>i.map(d=>d[g]||"").join(" / ")):[]).map(l=>l.trim()),rows:a}}function q(n){let t=[],e=/<otsl>([\s\S]*?)<\/otsl>/g;for(let s=e.exec(n);s!==null;s=e.exec(n)){let o=s[1]??"",i=X(o);(i.headers.length>0||i.rows.length>0)&&t.push(i);}let r=/<(?:picture|chart)>([\s\S]*?)<\/(?:picture|chart)>/g;for(let s=r.exec(n);s!==null;s=r.exec(n)){let o=s[1]??"";if(/<(fcel|ched|rhed)>/.test(o)){let i=o.replace(/<(?!nl|fcel|ched|rhed|srow|ecel|ucel|lcel|xcel)[a-z_]+>/g,""),a=X(i);(a.headers.length>0||a.rows.length>0)&&t.push(a);}}return t}function Y(n){return n.includes(",")||n.includes('"')||n.includes(`
`)||n.includes("\r")?`"${n.replace(/"/g,'""')}"`:n}function P(n){let t=[];n.headers.length>0&&t.push(n.headers.map(Y).join(","));for(let e of n.rows)t.push(e.map(Y).join(","));return t.join(`
`)}function Z(n){return n.map((t,e)=>{let r=P(t);return n.length>1?`# Table ${e+1}
${r}`:r}).join(`

`)}function Q(n){let t=/<(\w+)><loc_(\d+)><loc_(\d+)><loc_(\d+)><loc_(\d+)>/g,e=[];for(let r=t.exec(n);r!==null;r=t.exec(n)){let[,s,o,i,a,c]=r;s&&o&&i&&a&&c&&e.push({tagType:s,bbox:{left:Number.parseInt(o)/500,top:Number.parseInt(i)/500,right:Number.parseInt(a)/500,bottom:Number.parseInt(c)/500}});}return e}$();function st(n){return new x({type:"web",...n})}function ot(n){return n instanceof x||n?.type==="web"}export{_ as DoclingConverter,x as DoclingWebClient,E as clearModelCache,st as createWebClient,j as doclingToHtml,R as doclingToJson,z as doclingToMarkdown,V as doclingToPlainText,Q as extractOverlays,q as extractTables,k as getModelCacheSize,ot as isWebClient,K as renderPdfToImages,P as tableToCSV,Z as tablesToCSV};