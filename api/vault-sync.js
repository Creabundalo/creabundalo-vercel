const crypto = require('crypto');

function json(res,status,body){
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify(body));
}
function sha256Hex(value){
  return crypto.createHash('sha256').update(value).digest('hex');
}
function hmac(key,value,encoding){
  return crypto.createHmac('sha256',key).update(value).digest(encoding);
}
function encodeRfc3986(value){
  return encodeURIComponent(value).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
}
function isoParts(date=new Date()){
  const iso=date.toISOString().replace(/[:-]|\.\d{3}/g,'');
  return {amzDate:iso,dateStamp:iso.slice(0,8)};
}
function signingKey(secret,dateStamp,region){
  const kDate=hmac(Buffer.from('AWS4'+secret,'utf8'),dateStamp);
  const kRegion=hmac(kDate,region);
  const kService=hmac(kRegion,'s3');
  return hmac(kService,'aws4_request');
}
function presign({method,accessKey,secretKey,region,bucket,key,expires=90}){
  const endpoint='s3.'+region+'.scw.cloud';
  const canonicalUri='/' + [bucket,...key.split('/')].map(encodeRfc3986).join('/');
  const {amzDate,dateStamp}=isoParts();
  const scope=dateStamp+'/'+region+'/s3/aws4_request';
  const query=[
    ['X-Amz-Algorithm','AWS4-HMAC-SHA256'],
    ['X-Amz-Credential',accessKey+'/'+scope],
    ['X-Amz-Date',amzDate],
    ['X-Amz-Expires',String(expires)],
    ['X-Amz-SignedHeaders','host']
  ].map(([k,v])=>encodeRfc3986(k)+'='+encodeRfc3986(v)).sort().join('&');
  const canonicalHeaders='host:'+endpoint+'\n';
  const canonicalRequest=[method,canonicalUri,query,canonicalHeaders,'host','UNSIGNED-PAYLOAD'].join('\n');
  const stringToSign=[
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    sha256Hex(canonicalRequest)
  ].join('\n');
  const signature=hmac(signingKey(secretKey,dateStamp,region),stringToSign,'hex');
  return 'https://'+endpoint+canonicalUri+'?'+query+'&X-Amz-Signature='+signature;
}
function allowedOrigin(req){
  const origin=req.headers.origin;
  if(!origin) return null;
  const configured=(process.env.CREA_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean);
  if(configured.includes(origin)) return origin;
  try{
    const u=new URL(origin);
    const host=req.headers.host;
    if(host && u.host===host) return origin;
  }catch{}
  return null;
}
function parseUsers(){
  try{return JSON.parse(process.env.CREA_VAULT_SYNC_USERS||'{}')}catch{return {}}
}
function authenticate(req){
  const header=req.headers.authorization||'';
  if(!header.startsWith('Bearer ')) return null;
  const token=header.slice(7).trim();
  if(token.length<24) return null;
  const users=parseUsers();
  const owner=users[sha256Hex(token)];
  if(typeof owner!=='string'||!/^[A-Za-z0-9_-]{3,80}$/.test(owner)) return null;
  return owner;
}
function validateConfig(){
  const accessKey=process.env.SCW_ACCESS_KEY;
  const secretKey=process.env.SCW_SECRET_KEY;
  const bucket=process.env.SCW_OBJECT_BUCKET;
  const region=process.env.SCW_OBJECT_REGION||'nl-ams';
  if(!accessKey||!secretKey||!bucket) return null;
  if(!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket)) return null;
  if(!/^(nl-ams|fr-par|pl-waw|it-mil)$/.test(region)) return null;
  return {accessKey,secretKey,bucket,region};
}

module.exports = async function handler(req,res){
  const origin=allowedOrigin(req);
  if(origin){
    res.setHeader('Access-Control-Allow-Origin',origin);
    res.setHeader('Vary','Origin');
    res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  }
  if(req.method==='OPTIONS'){
    res.statusCode=204; return res.end();
  }
  if(req.method!=='POST') return json(res,405,{error:'METHOD_NOT_ALLOWED'});

  const cfg=validateConfig();
  if(!cfg) return json(res,503,{error:'SYNC_NOT_CONFIGURED'});

  const ownerId=authenticate(req);
  if(!ownerId) return json(res,401,{error:'UNAUTHORIZED'});

  const body=req.body && typeof req.body==='object' ? req.body : {};
  const action=body.action;

  const objectKey='creabundalo/v1/'+ownerId+'/primary/latest.enc.json';
  const expires=90;

  if(action==='presign-put'){
    return json(res,200,{
      action,
      expiresIn:expires,
      object:'latest',
      url:presign({method:'PUT',...cfg,key:objectKey,expires})
    });
  }
  if(action==='presign-get'){
    return json(res,200,{
      action,
      expiresIn:expires,
      object:'latest',
      url:presign({method:'GET',...cfg,key:objectKey,expires})
    });
  }
  return json(res,400,{error:'UNKNOWN_ACTION'});
};
