(()=>{
  const watch=document.getElementById('watchFace');
  const shell=document.querySelector('.app-shell');
  const timeEl=document.getElementById('watchTime');
  const dateEl=document.getElementById('watchDate');
  const recEl=document.getElementById('watchRecording');
  const mic=document.getElementById('micButton');
  const back=document.getElementById('watchBackButton');
  const other=document.getElementById('otherAppsButton');
  const camera=document.getElementById('quickCameraButton');
  let y0=null;

  function tick(){
    const n=new Date();
    if(timeEl) timeEl.textContent=new Intl.DateTimeFormat('nl-NL',{hour:'2-digit',minute:'2-digit'}).format(n);
    if(dateEl) dateEl.textContent=new Intl.DateTimeFormat('nl-NL',{weekday:'short',day:'numeric',month:'short'}).format(n);
  }
  tick(); setInterval(tick,15000);

  function showApp(){
    watch?.classList.add('hidden');
    shell?.classList.remove('watch-hidden');
    sessionStorage.setItem('p24.view','actio');
  }
  function showWatch(){
    shell?.classList.add('watch-hidden');
    watch?.classList.remove('hidden');
    sessionStorage.setItem('p24.view','watch');
  }
  function startRecord(){
    showApp();
    recEl?.classList.add('active');
    mic?.click();
    setTimeout(()=>recEl?.classList.remove('active'),12000);
  }

  watch?.addEventListener('pointerdown',e=>{y0=e.clientY;});
  watch?.addEventListener('pointerup',e=>{
    if(y0===null) return;
    const dy=e.clientY-y0; y0=null;
    if(dy<-45) showApp();
    else if(Math.abs(dy)<18) startRecord();
  });

  back?.addEventListener('click',showWatch);
  camera?.addEventListener('click',()=>document.getElementById('cameraButton')?.click());
  other?.addEventListener('click',()=>{
    if(window.P24Native?.openLauncher) return window.P24Native.openLauncher();
    if(typeof window.addLog==='function') window.addLog('DEVICE_ACTION','OPEN_ANDROID_LAUNCHER requested');
    alert('Op de M99 opent dit straks de gewone Android-apps. In de webpreview gebruik je nu Home/terug.');
  });

  // Native Android wrapper can call window.P24.functionButton().
  window.P24={
    functionButton:startRecord,
    showApp,
    showWatch,
    openCamera:()=>camera?.click()
  };

  // Best-effort browser test for keys that some Android devices expose.
  window.addEventListener('keydown',e=>{
    if(['F1','F2','Camera','MediaPlayPause'].includes(e.key)){
      e.preventDefault(); startRecord();
    }
  });

  // The watch is the default surface after a cold start.
  showWatch();
})();