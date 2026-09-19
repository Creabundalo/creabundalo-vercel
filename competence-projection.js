(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.CompetenceProjection=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const STORAGE_KEY='creabundalo.competence-profile.v1';
  const DEFAULT_STAGE='analysis';
  const STAGES=Object.freeze({
    guided:Object.freeze({
      id:'guided',label:'Begeleid',canonical:'ONBEWUST_ONBEKWAAM',
      description:'Gewone taal, veilige defaults en alleen de kernbetekenis.',
      depth:1,showGlossary:true,showTechnical:false,showEvidenceCodes:false,showRawSources:false
    }),
    learning:Object.freeze({
      id:'learning',label:'Leren',canonical:'BEWUST_ONBEKWAAM',
      description:'Betekenis plus bekende vaktermen en korte uitleg.',
      depth:2,showGlossary:true,showTechnical:true,showEvidenceCodes:false,showRawSources:false
    }),
    analysis:Object.freeze({
      id:'analysis',label:'Analyse',canonical:'BEWUST_BEKWAAM',
      description:'Vaktaal, mechanismen en bronstatus zonder ruwe machinevelden.',
      depth:3,showGlossary:false,showTechnical:true,showEvidenceCodes:true,showRawSources:false
    }),
    expert:Object.freeze({
      id:'expert',label:'Expert',canonical:'ONBEWUST_BEKWAAM',
      description:'Compacte cockpit met volledige technische en provenance-details.',
      depth:4,showGlossary:false,showTechnical:true,showEvidenceCodes:true,showRawSources:true
    })
  });

  function normalizeStage(stage){ return STAGES[stage]?stage:DEFAULT_STAGE; }

  function readProfile(storage){
    try{
      const raw=storage?.getItem?.(STORAGE_KEY);
      const parsed=raw?JSON.parse(raw):{};
      return parsed&&typeof parsed==='object'&&parsed.domains?parsed:{version:1,domains:{}};
    }catch{
      return {version:1,domains:{}};
    }
  }

  function writeProfile(profile,storage){
    storage?.setItem?.(STORAGE_KEY,JSON.stringify(profile));
    return profile;
  }

  function getStage(domain='default',storage){
    const profile=readProfile(storage);
    return normalizeStage(profile.domains?.[domain]?.stage||DEFAULT_STAGE);
  }

  function setStage(domain='default',stage=DEFAULT_STAGE,storage){
    const normalized=normalizeStage(stage);
    const profile=readProfile(storage);
    profile.version=1;
    profile.domains=profile.domains||{};
    profile.domains[domain]={
      ...(profile.domains[domain]||{}),
      stage:normalized,
      canonical:STAGES[normalized].canonical,
      updatedAt:new Date().toISOString()
    };
    writeProfile(profile,storage);
    return normalized;
  }

  function projectionFor(stage){ return STAGES[normalizeStage(stage)]; }

  function applyToDocument(doc,stage){
    const normalized=normalizeStage(stage);
    if(doc?.body){
      doc.body.dataset.competence=normalized;
      doc.body.dataset.competenceCanonical=STAGES[normalized].canonical;
    }
    return STAGES[normalized];
  }

  return {STORAGE_KEY,DEFAULT_STAGE,STAGES,normalizeStage,readProfile,writeProfile,getStage,setStage,projectionFor,applyToDocument};
});