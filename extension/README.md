# Creabundalo Semantic Overlay v0.1

## Doel
Een dunne context-/ordeningslaag bovenop de AI die de gebruiker al gebruikt.

De extension levert **geen eigen modelintelligentie** in v0.1. Hij ordent:
- current / root / terug;
- branches;
- projectpromotie;
- losse branch;
- breadcrumbs;
- een lokale patroonstatus als UX-placeholder;
- handmatige selectie voor corporate/unsupported AI.

## Privacybaseline
De extension vraagt bij installatie **geen host permissions**.

Required permissions:
- `activeTab` — tijdelijke toegang na expliciete klik op de extension;
- `scripting` — injecteert de overlay alleen in de actieve tab;
- `storage` — bewaart de sessiegraaf in `chrome.storage.session`.

De actuele sessiegraaf is bewust **session-only** en verdwijnt bij browser restart/reload van de extension. Er wordt geen chatinhoud naar `chrome.storage.local` of `sync` geschreven.

## Adaptermodel
```
Host AI page
   ↓
HostAdapter
   ↓
Semantic Overlay
   ↓
Graph event
   ↓
(later) Creabundalo Core / Vault / project context
```

v0.1:
- ChatGPT adapter: detecteert zichtbare user turns wanneer de gebruiker de overlay activeert.
- Generic adapter: geen automatische scraping; gebruiker kan geselecteerde tekst of handmatige invoer als branch toevoegen.

DOM-detectie is adaptercode en daarmee vervangbaar. De semantische graph-logica hoort niet in de hostadapter.

## Installeren voor development
1. Open `chrome://extensions`.
2. Zet Developer mode aan.
3. Kies **Load unpacked**.
4. Selecteer de map `extension/`.
5. Open een AI-site.
6. Klik op het Creabundalo-extensionicoon.

Edge Chromium kan dezelfde unpacked extension gebruiken via `edge://extensions`.

## UX
De overlay verschijnt links als minimale rail:
- ROOT → CURRENT breadcrumbs;
- huidige node;
- branches/siblings;
- terug/root;
- los;
- maak project;
- handmatige selectie.

Klik × om hem in te klappen; de ronde C-knop opent hem opnieuw.

## Patroonstatus
De meter in v0.1 is **geen semantische AI-score**. Het is een expliciete UX-placeholder op basis van branchdiepte. In de productiearchitectuur wordt deze vervangen door de Creabundalo semantic core die betekenis, open vragen, herhaling, besluiten en onzekerheid kan beoordelen.

## Volgende stap
1. Extension event bridge naar Creabundalo Core.
2. Vault-backed persistent graph i.p.v. session-only.
3. optionele host permission per ondersteunde AI voor permanente integratie;
4. adapters voor Claude/Gemini/corporate AI;
5. echte semantic pattern saturation;
6. browser alarm/offscreen runtime voor continuity jobs;
7. enterprise managed policy.
