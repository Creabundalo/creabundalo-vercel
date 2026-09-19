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
function presign({method,accessKey,secretKey,region,bucket,key,expires=90,headers={}}){
  const endpoint='s3.'+region+'.scw.cloud';
  const canonicalUri='/' + [bucket,...key.split('/')].map(encodeRfc3986).join('/');
  const {amzDate,dateStamp}=isoParts();
  const scope=dateStamp+'/'+region+'/s3/aws4_request';

  const headerMap={host:endpoint};
  for(const [name,value] of Object.entries(headers||{})){
    const lower=String(name).trim().toLowerCase();
    if(!lower||lower==='host') continue;
    headerMap[lower]=String(value).trim().replace(/\s+/g,' ');
  }
  const headerNames=Object.keys(headerMap).sort();
  const signedHeaders=headerNames.join(';');
  const canonicalHeaders=headerNames.map(name=>name+':'+headerMap[name]+'\n').join('');

  const query=[
    ['X-Amz-Algorithm','AWS4-HMAC-SHA256'],
    ['X-Amz-Credential',accessKey+'/'+scope],
    ['X-Amz-Date',amzDate],
    ['X-Amz-Expires',String(expires)],
    ['X-Amz-SignedHeaders',signedHeaders]
  ].map(([k,v])=>encodeRfc3986(k)+'='+encodeRfc3986(v)).sort().join('&');

  const canonicalRequest=[method,canonicalUri,query,canonicalHeaders,signedHeaders,'UNSIGNED-PAYLOAD'].join('\n');
  const stringToSign=[
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    sha256Hex(canonicalRequest)
  ].join('\n');
  const signature=hmac(signingKey(secretKey,dateStamp,region),stringToSign,'hex');
  return 'https://'+endpoint+canonicalUri+'?'+query+'&X-Amz-Signature='+signature;
}

function canonicalQuery(params){
  return Object.entries(params)
    .filter(([,v])=>v!==undefined&&v!==null)
    .map(([k,v])=>[encodeRfc3986(k),encodeRfc3986(String(v))])
    .sort((a,b)=>a[0]===b[0]?a[1].localeCompare(b[1]):a[0].localeCompare(b[0]))
    .map(([k,v])=>k+'='+v)
    .join('&');
}
function signHeaderRequest({method,accessKey,secretKey,region,bucket,query={}}){
  const endpoint='s3.'+region+'.scw.cloud';
  const canonicalUri='/'+encodeRfc3986(bucket);
  const {amzDate,dateStamp}=isoParts();
  const payloadHash=sha256Hex('');
  const queryString=canonicalQuery(query);
  const canonicalHeaders=
    'host:'+endpoint+'\n'+
    'x-amz-content-sha256:'+payloadHash+'\n'+
    'x-amz-date:'+amzDate+'\n';
  const signedHeaders='host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest=[
    method,canonicalUri,queryString,canonicalHeaders,signedHeaders,payloadHash
  ].join('\n');
  const scope=dateStamp+'/'+region+'/s3/aws4_request';
  const stringToSign=[
    'AWS4-HMAC-SHA256',amzDate,scope,sha256Hex(canonicalRequest)
  ].join('\n');
  const signature=hmac(signingKey(secretKey,dateStamp,region),stringToSign,'hex');
  const authorization=
    'AWS4-HMAC-SHA256 Credential='+accessKey+'/'+scope+
    ', SignedHeaders='+signedHeaders+
    ', Signature='+signature;
  return {
    url:'https://'+endpoint+canonicalUri+(queryString?'?'+queryString:''),
    headers:{
      'x-amz-content-sha256':payloadHash,
      'x-amz-date':amzDate,
      'Authorization':authorization
    }
  };
}
function xmlDecode(value=''){
  return value
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&apos;/g,"'")
    .replace(/&amp;/g,'&');
}
function xmlTag(block,tag){
  const m=block.match(new RegExp('<'+tag+'>([\\s\\S]*?)<\\/'+tag+'>'));
  return m?xmlDecode(m[1]):null;
}
async function listObjects(cfg,{prefix,cursor,maxKeys=250}={}){
  const query={'list-type':'2','prefix':prefix,'max-keys':String(Math.min(500,Math.max(1,Number(maxKeys)||250)))};
  if(cursor) query['continuation-token']=cursor;
  const signed=signHeaderRequest({method:'GET',...cfg,query});
  const response=await fetch(signed.url,{method:'GET',headers:signed.headers});
  const body=await response.text();
  if(!response.ok){
    const err=new Error('S3_LIST_'+response.status);
    err.status=response.status;
    throw err;
  }
  const contents=[...body.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)].map(m=>m[1]);
  const items=contents.map(block=>({
    key:xmlTag(block,'Key'),
    size:Number(xmlTag(block,'Size'))||0,
    etag:(xmlTag(block,'ETag')||'').replace(/^"|"$/g,''),
    lastModified:xmlTag(block,'LastModified')
  })).filter(x=>x.key);
  return {
    items,
    nextCursor:xmlTag(body,'NextContinuationToken'),
    truncated:xmlTag(body,'IsTruncated')==='true'
  };
}
function validVaultId(value){
  return /^vault_[A-Za-z0-9_-]{12,120}$/.test(String(value||''));
}
function validDeviceId(value){
  return /^dev_[A-Za-z0-9_-]{12,120}$/.test(String(value||''));
}
function validEventId(value){
  return /^[A-Za-z0-9_-]{8,160}$/.test(String(value||''));
}
function validSeq(value){
  return Number.isSafeInteger(Number(value)) && Number(value)>0 && Number(value)<1e12;
}
function eventObjectKey(ownerId,vaultId,{deviceId,seq,eventId}){
  if(!validVaultId(vaultId)||!validDeviceId(deviceId)||!validSeq(seq)||!validEventId(eventId)){
    throw new Error('INVALID_EVENT_SEGMENT');
  }
  const padded=String(Number(seq)).padStart(12,'0');
  return 'creabundalo/v2/'+ownerId+'/'+vaultId+'/events/'+deviceId+'/'+padded+'_'+eventId+'.enc.json';
}
function parseEventObjectKey(ownerId,vaultId,key){
  const base='creabundalo/v2/'+ownerId+'/'+vaultId+'/events/';
  if(!key.startsWith(base)) return null;
  const rest=key.slice(base.length);
  const m=rest.match(/^(dev_[A-Za-z0-9_-]{12,120})\/(\d{12})_([A-Za-z0-9_-]{8,160})\.enc\.json$/);
  if(!m) return null;
  return {deviceId:m[1],seq:Number(m[2]),eventId:m[3]};
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


  if(action==='list-event-segments'){
    const vaultId=String(body.vaultId||'');
    if(!validVaultId(vaultId)) return json(res,400,{error:'INVALID_VAULT_ID'});
    const prefix='creabundalo/v2/'+ownerId+'/'+vaultId+'/events/';
    try{
      const listed=await listObjects(cfg,{
        prefix,
        cursor:body.cursor?String(body.cursor):null,
        maxKeys:Math.min(250,Math.max(1,Number(body.maxKeys)||200))
      });
      const items=[];
      for(const object of listed.items){
        const parsed=parseEventObjectKey(ownerId,vaultId,object.key);
        if(!parsed) continue;
        items.push({
          ...parsed,
          size:object.size,
          etag:object.etag,
          lastModified:object.lastModified,
          url:presign({method:'GET',...cfg,key:object.key,expires})
        });
      }
      return json(res,200,{
        action,
        vaultId,
        items,
        nextCursor:listed.nextCursor||null,
        truncated:listed.truncated,
        expiresIn:expires
      });
    }catch(err){
      return json(res,502,{error:err.message||'EVENT_LIST_FAILED'});
    }
  }

  if(action==='presign-event-put-batch'){
    const vaultId=String(body.vaultId||'');
    if(!validVaultId(vaultId)) return json(res,400,{error:'INVALID_VAULT_ID'});
    const segments=Array.isArray(body.segments)?body.segments:[];
    if(!segments.length||segments.length>100) return json(res,400,{error:'INVALID_SEGMENT_BATCH'});
    try{
      const uploads=segments.map(segment=>{
        const key=eventObjectKey(ownerId,vaultId,segment);
        return {
          deviceId:String(segment.deviceId),
          seq:Number(segment.seq),
          eventId:String(segment.eventId),
          url:presign({method:'PUT',...cfg,key,expires,headers:{'if-none-match':'*'}}),
          headers:{'If-None-Match':'*'}
        };
      });
      return json(res,200,{action,vaultId,uploads,expiresIn:expires});
    }catch(err){
      return json(res,400,{error:err.message||'INVALID_EVENT_SEGMENT'});
    }
  }

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
