const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('i18n.js','utf8');
const ctx={};vm.createContext(ctx);
vm.runInContext(source.slice(0,source.indexOf("document.querySelectorAll('[data-language-option]')",source.indexOf('function applyLanguage')))+"\nthis.dictionaries=translations;",ctx);
const d=ctx.dictionaries;
function keys(o,p=''){return Object.entries(o).flatMap(([k,v])=>typeof v==='object'?keys(v,p+k+'.'):[p+k]);}
const zh=keys(d['zh-TW']).filter(x=>!x.startsWith('static.')&&!x.startsWith('attributes.')&&!x.startsWith('placeholders.'));
const en=keys(d.en).filter(x=>!x.startsWith('static.')&&!x.startsWith('attributes.')&&!x.startsWith('placeholders.'));
assert.deepEqual(zh.sort(),en.sort());
const s=fs.readFileSync('script.js','utf8');
for(const match of s.matchAll(/\bt\('([^']+)'/g))assert(zh.includes(match[1]),'missing translation: '+match[1]);
console.log('PASS: dynamic translation keys match in zh-TW and en');
