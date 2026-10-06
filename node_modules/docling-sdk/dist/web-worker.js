import {env,AutoProcessor,AutoModelForVision2Seq,load_image,TextStreamer}from'@huggingface/transformers';var W=new Map;function L(t){return {async match(n){let e=await caches.open("hf-model-cache"),r=(typeof n=="string"?n:n.url).replace(/^\/models\/([^/]+\/[^/]+)\/(.*)$/,"https://huggingface.co/$1/resolve/main/$2"),o=await e.match(r);if(o){let m=o.clone();return t?.(1,`Cached: ${P(r)}`),m}let a=await fetch(r);if(!a.ok)throw new Error(`Fetch failed: ${a.status} ${a.statusText}`);let i=a.headers.get("Content-Length"),c=i?Number.parseInt(i,10):0,l=0,g=a.body?.getReader();if(!g)throw new Error("Response body is not readable");let d=[];for(;;){let{done:m,value:x}=await g.read();if(m)break;d.push(x),l+=x.length,W.set(r,{loaded:l,total:c});let R=0,y=0;for(let{loaded:ee,total:S}of W.values())S&&(R+=ee,y+=S);let Q=y>0?R/y:0;t?.(Q,`Downloading: ${P(r)}`);}let h=new Blob(d),p=new Response(h,{headers:a.headers});return await e.put(r,p.clone()),p},async put(){}}}function P(t){let n=t.split("/");return n[n.length-1]??t}var O=class{simpleTagMap;selfClosingTagMap;TABLE_TAG_CONFIG;TABLE_TAG_REGEX;combinedTagRegex;startTagOverrides;inlineTagConverters;tagConverters;constructor(){this.simpleTagMap={doctag:"div",document:"div",ordered_list:"ol",unordered_list:"ul",list_item:"li",caption:"figcaption",footnote:"sup",formula:"div",page_footer:"footer",page_header:"header",picture:"figure",chart:"figure",table:"table",otsl:"table",text:"p",paragraph:"p",title:"h1",document_index:"div",form:"form",key_value_region:"dl",reference:"a",smiles:"span"},this.selfClosingTagMap={checkbox_selected:'<input type="checkbox" checked disabled>',checkbox_unselected:'<input type="checkbox" disabled>',page_break:'<hr class="page-break">'},this.TABLE_TAG_CONFIG={"<ched>":{htmlTag:"th"},"<rhed>":{htmlTag:"th",scope:"row"},"<srow>":{htmlTag:"th",scope:"row"},"<fcel>":{htmlTag:"td"},"<ecel>":{htmlTag:"td"},"<ucel>":{htmlTag:"td"},"<lcel>":{htmlTag:"td"},"<xcel>":{htmlTag:"td"}},this.TABLE_TAG_REGEX=new RegExp(`(${Object.keys(this.TABLE_TAG_CONFIG).join("|")})`),this.startTagOverrides={doctag:'<div class="docling-document">',document:'<div class="docling-document">',formula:'<div class="formula">',document_index:'<div class="toc">',smiles:'<span class="smiles">',reference:'<a href="#">'},this.tagConverters={code:e=>this.convertBlockCode(e),otsl:e=>this.convertTable(e),picture:e=>this.convertPictureOrChart("picture",e),chart:e=>this.convertPictureOrChart("chart",e),inline:e=>this.convertInlineContent(e)};for(let e=0;e<=5;e++)this.tagConverters[`section_header_level_${e}`]=s=>{let r=e+1;return `<h${r}>${this.processTags(s)}</h${r}>`};this.inlineTagConverters={code:e=>{let s=/<_(.*?)_>/,r=e.match(s);if(r?.[1]){let o=this.sanitizeLanguageName(r[1]),a=e.replace(s,"").trim(),i=this.escapeHtml(a);return `<code${o!=="unknown"?` class="language-${o}"`:""}>${i}</code>`}return `<code>${this.escapeHtml(e)}</code>`},formula:e=>`<span class="formula">${this.escapeHtml(e)}</span>`,smiles:e=>`<span class="smiles">${this.escapeHtml(e)}</span>`,text:e=>this.escapeHtml(e)};let n=Object.keys(this.selfClosingTagMap).join("|");this.combinedTagRegex=new RegExp(`(<([a-z_0-9]+)>(.*?)<\\/\\2>)|(<(${n})>)`,"s");}escapeHtml(n){return n?n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}convert(n){let e=` ${n} `;return e=this.cleanupMetadataTokens(e),e=this.processTags(e),e.trim()}processTags(n){let e=n,s="";for(;e.length>0;){let r=e.match(this.combinedTagRegex);if(r&&typeof r.index=="number"){let o=e.substring(0,r.index);s+=this.escapeHtml(o);let a=r[0],i=r[2],c=r[3],l=r[5];i!==void 0?s+=this.convertSingleTag(i,c??""):l!==void 0&&(s+=this.selfClosingTagMap[l]??""),e=e.substring(r.index+a.length);}else {s+=this.escapeHtml(e);break}}return s}convertSingleTag(n,e){let s=n==="list_item"?e.trim().replace(/^[·-]\s*/g,""):e,r=this.tagConverters[n];if(r)return r(s);let o=this.simpleTagMap[n];if(o){let a=this.processTags(s);return `${this.getStartTag(n,o)}${a}</${o}>`}return this.escapeHtml(`<${n}>${s}</${n}>`)}getStartTag(n,e){return this.startTagOverrides[n]??`<${e}>`}convertInlineContent(n){let e=/<(code|formula|text|smiles)>(.*?)<\/\1>/s,s=n,r="";for(;s.length>0;){let o=s.match(e);if(o&&typeof o.index=="number"){let a=s.substring(0,o.index);r+=this.escapeHtml(a);let[i,c,l]=o,g=this.inlineTagConverters[c??""];g&&(r+=g(l??"")),s=s.substring(o.index+i.length);}else {r+=this.escapeHtml(s);break}}return r}convertBlockCode(n){let e=/<_(.*?)_>/,s=n.match(e),r="unknown",o=n;s?.[1]&&(r=this.sanitizeLanguageName(s[1]),o=n.replace(e,"").trim());let a=this.escapeHtml(o);return `<pre><code${r!=="unknown"?` class="language-${r}"`:""}>${a}</code></pre>`}convertTable(n){let e=n.trim().split(/<nl>/).filter(o=>o.length>0),s=[];return e.forEach((o,a)=>{let i=o.split(this.TABLE_TAG_REGEX),c=[],l=0;for(let g=1;g<i.length;g+=2){let d=i[g],h=i[g+1]??"";switch(d){case "<lcel>":{let p=c[c.length-1];p&&p.colspan++;break}case "<ucel>":{let p=s[a-1]?.[l];a>0&&p&&p.rowspan++,l++;break}case "<xcel>":{let p=c[c.length-1];p&&p.colspan++;break}default:d&&this.TABLE_TAG_CONFIG[d]&&(c.push({content:h,tag:d,colspan:1,rowspan:1}),l++);break}}s.push(c);}),`<table><tbody>${s.map(o=>`<tr>${o.map(i=>{let c=this.TABLE_TAG_CONFIG[i.tag];if(!c)return "";let l=[];i.colspan>1&&l.push(`colspan="${i.colspan}"`),i.rowspan>1&&l.push(`rowspan="${i.rowspan}"`),c.scope&&l.push(`scope="${c.scope}"`);let g=this.processTags(i.content),d=l.length>0?` ${l.join(" ")}`:"";return `<${c.htmlTag}${d}>${g}</${c.htmlTag}>`}).join("")}</tr>`).join("")}</tbody></table>`}convertPictureOrChart(n,e){if(/<(fcel|ched|rhed)>/.test(e)){let h=e.replace(/<[a-z_]+>/g,p=>p.startsWith("<fcel")||p.startsWith("<ched")||p.startsWith("<rhed")||p.startsWith("<nl")?p:"");return this.convertTable(h)}let s="",r=/<caption>(.*?)<\/caption>/s,o=e.match(r);o?.[1]&&(s=`<figcaption>${this.processTags(o[1])}</figcaption>`);let a=e.replace(r,""),i=/<([a-z_]+)>/,c=a.match(i),l=n;c&&(l=c[1]?.replace(/_/g," ")??n);let g=`<img alt="${this.escapeHtml(l)}" src="">`,d=this.simpleTagMap[n]??"figure";return `<${d}>${g}${s}</${d}>`}sanitizeLanguageName(n){let e=n.toLowerCase();return {"c#":"csharp","c++":"cpp",objectivec:"objective-c",visualbasic:"vb",javascript:"js",typescript:"ts",python:"py",ruby:"rb",dockerfile:"docker"}[e]??e.replace(/[\s#+]/g,"-")}cleanupMetadataTokens(n){return n.replace(/<loc_[0-9]+>/g,"")}};function A(t){return `<!DOCTYPE html>
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
${new O().convert(t)}
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
</html>`}var j=0;function D(){return `#/texts/${j++}`}function te(){j=0;}function G(t){let n=/<loc_(\d+)>/g,e=[...t.matchAll(n)],s=t.replace(n,"").trim();if(e.length>=4){let r=e.slice(0,4).map(o=>Number.parseInt(o[1]??"0",10)/1e3);return {bbox:{l:r[0]??0,t:r[1]??0,r:r[2]??0,b:r[3]??0,coord_origin:"TOPLEFT"},cleanContent:s}}return {bbox:null,cleanContent:s}}function ne(t,n=1){return t?[{page_no:n,bbox:t,charspan:[0,0]}]:[]}function re(t){let n=t.trim().split(/<nl>/).filter(o=>o.length>0),e=[],s=0,r=/<(ched|rhed|srow|fcel|ecel|ucel|lcel|xcel)>/g;return n.forEach((o,a)=>{let i=[],c=0,l=o.split(r);for(let g=1;g<l.length;g+=2){let d=l[g],h=(l[g+1]??"").trim(),p=d==="ched"||d==="rhed"||d==="srow";switch(d){case "lcel":{let m=i[i.length-1];m&&(m.col_span=(m.col_span||1)+1),c++;break}case "ucel":{let m=e[a-1]?.[c];a>0&&m&&(m.row_span=(m.row_span||1)+1),c++;break}case "xcel":c++;break;default:i.push({text:h,row_span:1,col_span:1,start_row_offset_idx:a,end_row_offset_idx:a+1,start_col_offset_idx:c,end_col_offset_idx:c+1,col_header:p&&d==="ched",row_header:p&&(d==="rhed"||d==="srow")}),c++;break}}s=Math.max(s,c),e.push(i);}),{num_rows:e.length,num_cols:s,table_cells:e.flat()}}function se(t){let n=/<([a-z_0-9]+)>([\s\S]*?)<\/\1>/,e=t.match(n);return e?{tagName:e[1]??"",content:e[2]??"",fullMatch:e[0]}:null}function b(t,n,e){let s=D(),r={self_ref:s,parent:{$ref:"#/body"},children:[],label:n,prov:t.prov,orig:t.cleanContent,text:t.cleanContent,...e};t.texts.push(r),t.bodyChildren.push({$ref:s});}function C(t){let n=Number.parseInt(t.tag.tagName.slice(-1),10)+1;b(t,"section_header",{level:n});}function $(t){b(t,t.tag.tagName);}function N(t){let n=t.tag.content.match(/<caption>([\s\S]*?)<\/caption>/),e=n?n[1]?.replace(/<loc_\d+>/g,"").trim():void 0,s=`#/pictures/${t.pictures.length}`,r={self_ref:s,parent:{$ref:"#/body"},children:[],label:t.tag.tagName==="chart"?"chart":"picture",prov:t.prov,caption:e};t.pictures.push(r),t.bodyChildren.push({$ref:s});}function H(t){let n=/<list_item>([\s\S]*?)<\/list_item>/g;for(let e=n.exec(t.tag.content);e!==null;e=n.exec(t.tag.content)){let{cleanContent:s}=G(e[1]??""),r=s.replace(/^[·\-]\s*/,"").trim(),o=D(),a={self_ref:o,parent:{$ref:"#/body"},children:[],label:"list_item",prov:[],orig:r,text:r,enumerated:t.tag.tagName==="ordered_list"};t.texts.push(a),t.bodyChildren.push({$ref:o});}}var oe={doctag:t=>E(t.tag.content,t.texts,t.tables,t.pictures,t.bodyChildren),document:t=>E(t.tag.content,t.texts,t.tables,t.pictures,t.bodyChildren),title:t=>b(t,"title"),section_header_level_0:C,section_header_level_1:C,section_header_level_2:C,section_header_level_3:C,section_header_level_4:C,section_header_level_5:C,text:t=>b(t,"text"),paragraph:t=>b(t,"text"),code:t=>{let n=t.cleanContent.match(/<_([^_]+)_>/),e=n?n[1]:void 0,s=t.cleanContent.replace(/<_[^_]+_>/,"").trim();b(t,"code",{orig:s,text:s,language:e});},formula:t=>b(t,"formula"),otsl:t=>{let n=re(t.tag.content),e=`#/tables/${t.tables.length}`,s={self_ref:e,parent:{$ref:"#/body"},children:[],label:"table",prov:t.prov,data:n};t.tables.push(s),t.bodyChildren.push({$ref:e});},picture:N,chart:N,ordered_list:H,unordered_list:H,caption:$,footnote:$,page_header:$,page_footer:$};function E(t,n,e,s,r){let o=t;for(;o.length>0;){let a=se(o);if(!a)break;let i=o.indexOf(a.fullMatch);o=o.slice(i+a.fullMatch.length);let{bbox:c,cleanContent:l}=G(a.content),g=ne(c),d={tag:a,cleanContent:l,prov:g,texts:n,tables:e,pictures:s,bodyChildren:r},h=oe[a.tagName];h?h(d):l?.trim()&&b(d,"text");}}function z(t,n="document"){te();let e=[],s=[],r=[],o=[];return E(t,e,s,r,o),{schema_name:"DoclingDocument",version:"1.0.0",name:n,texts:e,tables:s,pictures:r,body:{self_ref:"#/body",parent:null,children:o,label:"body"},pages:{1:{size:{width:612,height:792}}}}}var ae=new Set(["lcel","ucel","xcel"]);function u(t){return t.replace(/<loc_\d+>/g,"").trim()}function ie(t){let n=t.trim().split(/<nl>/).filter(i=>i.length>0);if(n.length===0)return "";let e=/<(ched|rhed|srow|fcel|ecel|ucel|lcel|xcel)>/g,s=[],r=0;for(let i of n){let c=[],l=i.split(e);for(let g=1;g<l.length;g+=2){let d=l[g],h=u(l[g+1]??"");c.push(ae.has(d??"")?"":h);}r=Math.max(r,c.length),s.push(c);}if(s.length===0||r===0)return "";for(let i of s)for(;i.length<r;)i.push("");let o=[],a=s[0]??[];o.push(`| ${a.map(i=>i.replace(/\|/g,"\\|")).join(" | ")} |`),o.push(`| ${a.map(()=>"---").join(" | ")} |`);for(let i=1;i<s.length;i++){let c=s[i]??[];o.push(`| ${c.map(l=>l.replace(/\|/g,"\\|")).join(" | ")} |`);}return o.join(`
`)}var le={code:t=>`\`${t}\``,formula:t=>`$${t}$`,smiles:t=>`\`${t}\``,text:t=>t};function ce(t){let n=/<(code|formula|text|smiles)>([\s\S]*?)<\/\1>/g,e="",s=0;for(let r=n.exec(t);r!==null;r=n.exec(t)){let o=t.slice(s,r.index);e+=u(o);let[,a,i]=r,c=u(i??""),l=le[a??""];e+=l?l(c):c,s=r.index+r[0].length;}return e+=u(t.slice(s)),e}function ge(t,n){let e=n.match(/<_([^_]+)_>/),s=e?e[1]:"",r=u(n.replace(/<_[^_]+_>/,"")).trim();return `\`\`\`${s}
${r}
\`\`\`

`}function de(t,n,e){return e.includes(`
`)||e.length>50?`$$
${e}
$$

`:`$${e}$

`}function pe(t,n){let e=[],s=/<list_item>([\s\S]*?)<\/list_item>/g,r=1;for(let o=s.exec(n);o!==null;o=s.exec(n)){let a=u(o[1]??"").replace(/^[·\-]\s*/,"").trim();e.push(`${r}. ${a}`),r++;}return `${e.join(`
`)}

`}function he(t,n){let e=[],s=/<list_item>([\s\S]*?)<\/list_item>/g;for(let r=s.exec(n);r!==null;r=s.exec(n)){let o=u(r[1]??"").replace(/^[·\-]\s*/,"").trim();e.push(`- ${o}`);}return `${e.join(`
`)}

`}function B(t,n){let e=n.match(/<caption>([\s\S]*?)<\/caption>/);return `![${e?u(e[1]??""):t}]()

`}var F=(t,n,e)=>`${e}

`,me={doctag:(t,n)=>I(n),document:(t,n)=>I(n),title:(t,n,e)=>`# ${e}

`,section_header_level_0:(t,n,e)=>`## ${e}

`,section_header_level_1:(t,n,e)=>`### ${e}

`,section_header_level_2:(t,n,e)=>`#### ${e}

`,section_header_level_3:(t,n,e)=>`##### ${e}

`,section_header_level_4:(t,n,e)=>`###### ${e}

`,section_header_level_5:(t,n,e)=>`###### ${e}

`,text:F,paragraph:F,code:ge,formula:de,otsl:(t,n)=>`${ie(n)}

`,picture:B,chart:B,ordered_list:pe,unordered_list:he,list_item:(t,n,e)=>`- ${e.replace(/^[·\-]\s*/,"").trim()}
`,caption:(t,n,e)=>`*${e}*

`,footnote:(t,n,e)=>`[^note]: ${e}

`,page_header:()=>"",page_footer:()=>"",page_break:()=>`
---

`,checkbox_selected:()=>"- [x] ",checkbox_unselected:()=>"- [ ] ",inline:(t,n)=>ce(n)};function ue(t,n){let e=u(n),s=me[t];return s?s(t,n,e):e?`${e}

`:""}function I(t){let n="",e=t,s=/<([a-z_0-9]+)>([\s\S]*?)<\/\1>/;for(;e.length>0;){let r=e.match(s);if(r&&r.index!==void 0){let o=e.slice(0,r.index),a=u(o);a.trim()&&(n+=`${a}

`),n+=ue(r[1]??"",r[2]??""),e=e.slice(r.index+r[0].length);}else {let o=u(e);o.trim()&&(n+=`${o}

`);break}}return n.replace(/\n{3,}/g,`

`).trim()}function J(t){return I(t)}var fe=new Set(["lcel","ucel","xcel"]);function f(t){return t.replace(/<loc_\d+>/g,"").trim()}function _e(t){let n=t.trim().split(/<nl>/).filter(o=>o.length>0);if(n.length===0)return "";let e=/<(ched|rhed|srow|fcel|ecel|ucel|lcel|xcel)>/g,s=[],r=0;for(let o of n){let a=[],i=o.split(e);for(let c=1;c<i.length;c+=2){let l=i[c],g=f(i[c+1]??"");a.push(fe.has(l??"")?"":g);}r=Math.max(r,a.length),s.push(a);}if(s.length===0||r===0)return "";for(let o of s)for(;o.length<r;)o.push("");return s.map(o=>o.join("	")).join(`
`)}function be(t){let n=/<(code|formula|text|smiles)>([\s\S]*?)<\/\1>/g,e="",s=0;for(let r=n.exec(t);r!==null;r=n.exec(t)){let o=t.slice(s,r.index);e+=f(o);let[,,a]=r;e+=f(a??""),s=r.index+r[0].length;}return e+=f(t.slice(s)),e}function xe(t,n){return `${f(n.replace(/<_[^_]+_>/,"")).trim().split(`
`).map(r=>`    ${r}`).join(`
`)}

`}function Te(t,n){let e=[],s=/<list_item>([\s\S]*?)<\/list_item>/g,r=1;for(let o=s.exec(n);o!==null;o=s.exec(n)){let a=f(o[1]??"").replace(/^[·\-]\s*/,"").trim();e.push(`${r}. ${a}`),r++;}return `${e.join(`
`)}

`}function Ce(t,n){let e=[],s=/<list_item>([\s\S]*?)<\/list_item>/g;for(let r=s.exec(n);r!==null;r=s.exec(n)){let o=f(r[1]??"").replace(/^[·\-]\s*/,"").trim();e.push(`* ${o}`);}return `${e.join(`
`)}

`}function X(t,n){let e=n.match(/<caption>([\s\S]*?)<\/caption>/);return `[${e?f(e[1]??""):`[${t}]`}]

`}var w=(t,n,e)=>`${e}
${"-".repeat(Math.min(e.length,40))}

`,U=(t,n,e)=>`${e}

`,we={doctag:(t,n)=>M(n),document:(t,n)=>M(n),title:(t,n,e)=>`${e}
${"=".repeat(Math.min(e.length,50))}

`,section_header_level_0:w,section_header_level_1:w,section_header_level_2:w,section_header_level_3:w,section_header_level_4:w,section_header_level_5:w,text:U,paragraph:U,code:xe,formula:(t,n,e)=>`${e}

`,otsl:(t,n)=>`${_e(n)}

`,picture:X,chart:X,ordered_list:Te,unordered_list:Ce,list_item:(t,n,e)=>`* ${e.replace(/^[·\-]\s*/,"").trim()}
`,caption:(t,n,e)=>`[${e}]

`,footnote:(t,n,e)=>`[Note: ${e}]

`,page_header:()=>"",page_footer:()=>"",page_break:()=>`
${"\u2500".repeat(40)}

`,checkbox_selected:()=>"[X] ",checkbox_unselected:()=>"[ ] ",inline:(t,n)=>be(n),reference:(t,n,e)=>e,smiles:(t,n,e)=>e};function ve(t,n){let e=f(n),s=we[t];return s?s(t,n,e):e?`${e}

`:""}function M(t){let n="",e=t,s=/<([a-z_0-9]+)>([\s\S]*?)<\/\1>/;for(;e.length>0;){let r=e.match(s);if(r&&r.index!==void 0){let o=e.slice(0,r.index),a=f(o);a.trim()&&(n+=`${a}

`),n+=ve(r[1]??"",r[2]??""),e=e.slice(r.index+r[0].length);}else {let o=f(e);o.trim()&&(n+=`${o}

`);break}}return n.replace(/\n{3,}/g,`

`).trim()}function Y(t){return M(t)}function V(t){let n=/<(\w+)><loc_(\d+)><loc_(\d+)><loc_(\d+)><loc_(\d+)>/g,e=[];for(let s=n.exec(t);s!==null;s=n.exec(t)){let[,r,o,a,i,c]=s;r&&o&&a&&i&&c&&e.push({tagType:r,bbox:{left:Number.parseInt(o)/500,top:Number.parseInt(a)/500,right:Number.parseInt(i)/500,bottom:Number.parseInt(c)/500}});}return e}var Re=new Set(["lcel","ucel","xcel"]);function $e(t){return t.replace(/<loc_\d+>/g,"").trim()}function q(t){let n=t.trim().split(/<nl>/).filter(l=>l.length>0),e=/<(ched|rhed|srow|fcel|ecel|ucel|lcel|xcel)>/g,s=[],r=new Set,o=0;n.forEach((l,g)=>{let d=[],h=l.split(e),p=false;for(let m=1;m<h.length;m+=2){let x=h[m],R=$e(h[m+1]??"");(x==="ched"||x==="rhed"||x==="srow")&&(p=true),d.push(Re.has(x??"")?"":R);}p&&r.add(g),o=Math.max(o,d.length),s.push(d);});for(let l of s)for(;l.length<o;)l.push("");let a=[],i=[];if(r.size>0){let l=0;for(let g=0;g<s.length&&r.has(g);g++)l=g+1;a=s.slice(0,l),i=s.slice(l);}else s.length>0&&(a=[s[0]??[]],i=s.slice(1));return {headers:(a.length>0?(a[0]??[]).map((l,g)=>a.map(d=>d[g]||"").join(" / ")):[]).map(l=>l.trim()),rows:i}}function K(t){let n=[],e=/<otsl>([\s\S]*?)<\/otsl>/g;for(let r=e.exec(t);r!==null;r=e.exec(t)){let o=r[1]??"",a=q(o);(a.headers.length>0||a.rows.length>0)&&n.push(a);}let s=/<(?:picture|chart)>([\s\S]*?)<\/(?:picture|chart)>/g;for(let r=s.exec(t);r!==null;r=s.exec(t)){let o=r[1]??"";if(/<(fcel|ched|rhed)>/.test(o)){let a=o.replace(/<(?!nl|fcel|ched|rhed|srow|ecel|ucel|lcel|xcel)[a-z_]+>/g,""),i=q(a);(i.headers.length>0||i.rows.length>0)&&n.push(i);}}return n}env.useBrowserCache=false;env.useFSCache=false;env.useCustomCache=true;env.allowRemoteModels=true;env.allowLocalModels=false;var Ie="onnx-community/granite-docling-258M-ONNX",v=null,k=null,Z=false;function _(t){self.postMessage(t);}function Me(){env.customCache=L((t,n)=>{_({type:"PROGRESS",progress:t,status:n});});}async function Se(t){let n=t.modelId??Ie;if(t.wasmPaths&&(env.backends.onnx={wasm:{wasmPaths:t.wasmPaths}}),v||(_({type:"PROGRESS",progress:0,status:"Loading processor..."}),v=await AutoProcessor.from_pretrained(n)),!k){_({type:"PROGRESS",progress:.1,status:"Loading model..."});let e="webgpu";t.device==="wasm"?e="wasm":(t.device==="auto"||t.device==="webgpu")&&(navigator.gpu||(e="wasm"));let s={};k=await AutoModelForVision2Seq.from_pretrained(n,{dtype:{embed_tokens:"fp16",vision_encoder:"fp32",decoder_model_merged:"fp32"},device:e,progress_callback:r=>{if(r.status==="progress"&&r.file?.endsWith?.("onnx_data")){if(s[r.file]={loaded:r.loaded,total:r.total},Object.keys(s).length<3)return;let o=0,a=0;for(let c of Object.values(s))o+=c.loaded,a+=c.total;let i=Math.round(o/a*100);_({type:"PROGRESS",progress:i/100,status:`Downloading model: ${i}%`});}}});}Z=true,_({type:"READY"});}async function We(t,n=4096){if(!v||!k)throw new Error("Model not initialized. Call INIT first.");_({type:"REPORT",status:"Loading image..."});let e=await load_image(t);_({type:"REPORT",status:"Constructing prompt..."});let s=[{role:"user",content:[{type:"image"},{type:"text",text:"Convert this page to docling."}]}],r=v.apply_chat_template(s,{add_generation_prompt:true}),o=await v(r,[e],{do_image_splitting:true});_({type:"REPORT",status:"Processing..."});let a="",i=0,c=v.tokenizer;if(!c)throw new Error("Tokenizer not available");await k.generate({...o,max_new_tokens:n,streamer:new TextStreamer(c,{skip_prompt:true,skip_special_tokens:false,callback_function(g){i+=1,_({type:"STREAM",chunk:g,progress:Math.min(i/n,1)}),a+=g;}})});let l=a.replace(/<\|end_of_text\|>$/,"");_({type:"DONE",text:l,html:A(l),markdown:J(l),plainText:Y(l),json:z(l),tables:K(l),overlays:V(l)});}var Pe={INIT:async t=>{Me(),await Se(t.config);},PROCESS_FILE:async t=>{if(!Z)throw new Error("Worker not initialized. Send INIT message first.");await We(t.src,t.maxNewTokens);}};self.onmessage=async t=>{try{let n=Pe[t.data.type];if(!n)throw new Error(`Unknown message type: ${t.data.type}`);await n(t.data);}catch(n){let e=n instanceof Error?n.message:String(n);_({type:"ERROR",error:e});}};