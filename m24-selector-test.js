'use strict';
const assert=require('assert');
const fs=require('fs');
const src=fs.readFileSync('m24.js','utf8');

assert(src.includes("$$('.lens').forEach"), 'lens listeners must use collection selector $$');
assert(src.includes("$$('.mode').forEach"), 'mode listeners must use collection selector $$');
assert(src.includes("$$('.breadcrumb button').forEach"), 'breadcrumb listeners must use collection selector $$');
assert(!/(?<!\$)\$\('\.lens'\)\.forEach/.test(src), 'single-element $ selector must not be iterated');

console.log('M24 selector collection contract PASS');
