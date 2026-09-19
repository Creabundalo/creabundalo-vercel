# Scaleway Vault Sync · pilot setup

Deze pilot gebruikt Scaleway voor twee gescheiden rollen: **encrypted semantic event sync** voor multi-device werking en een **encrypted Vault snapshot** voor disaster recovery. De browser krijgt nooit de Scaleway access key of secret key.

## 1. Maak een private Object Storage bucket
Aanbevolen regio: `nl-ams` (Amsterdam).

Voorbeeld bucketnaam:
```
creabundalo-vault-pilot
```

Gebruik een **private** bucket.

## 2. Maak een beperkte Scaleway API key
Gebruik een aparte IAM identity/key voor deze pilot en geef alleen de minimale Object Storage-rechten op de betreffende bucket: `s3:ListBucket` plus `s3:GetObject`/`s3:PutObject` op de Creabundalo-prefix. Event-sync heeft geen delete-recht nodig.

Zet de waarden als Vercel environment variables:
```
SCW_ACCESS_KEY=...
SCW_SECRET_KEY=...
SCW_OBJECT_BUCKET=creabundalo-vault-pilot
SCW_OBJECT_REGION=nl-ams
```

De credentials mogen nooit in frontend-JavaScript, GitHub of browser storage terechtkomen.

## 3. Maak een user-scoped sync token
Genereer lokaal een random token en SHA-256 hash, bijvoorbeeld met Node:

```bash
node -e "const c=require('crypto');const t=c.randomBytes(32).toString('base64url');console.log('TOKEN='+t);console.log('HASH='+c.createHash('sha256').update(t).digest('hex'))"
```

Bewaar de TOKEN bij de pilotgebruiker. Alleen de HASH komt in Vercel:

```
CREA_VAULT_SYNC_USERS={"<HASH>":"user_pseudonym_001"}
```

Gebruik een pseudonieme owner-id, geen naam of e-mailadres.

## 4. Allowed origins
Voor same-origin gebruik in Creabundalo is geen extra API-CORS nodig. Voor de directe browser → Object Storage PUT/GET moet de bucket CORS de exacte Creabundalo-origin toestaan.

Voorbeeld `cors.json`:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://JOUW-CREABUNDALO-DOMEIN"
      ],
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "HEAD", "PUT"],
      "MaxAgeSeconds": 300,
      "ExposeHeaders": ["ETag"]
    }
  ]
}
```

Toepassen met een Scaleway-geconfigureerde AWS CLI:

```bash
aws s3api put-bucket-cors \
  --bucket creabundalo-vault-pilot \
  --cors-configuration file://cors.json \
  --endpoint-url https://s3.nl-ams.scw.cloud
```

Voeg voor een tijdelijke Vercel preview alleen de specifieke preview-origin toe die je test; gebruik voor productie geen wildcard-origin.

## 5. Optionele API-origin allowlist
Als de Vault API later vanuit een browserextension of ander domein wordt aangeroepen:

```
CREA_ALLOWED_ORIGINS=https://creabundalo.example,chrome-extension://EXTENSION_ID
```

De huidige Branch UI gebruikt dezelfde Vercel-origin en heeft dit niet nodig.

## 6. Flow
```
Browser Vault
  ↓ export encrypted snapshot
/api/vault-sync
  ↓ auth user-scoped token
  ↓ presign 90 sec
Browser
  ↓ PUT ciphertext
Scaleway Object Storage

Restore:
Browser → /api/vault-sync → presigned GET → ciphertext → local import → unlock
```

## Securitygrenzen pilot
- 1 primaire remote Vault per sync-token.
- Sync-token blijft alleen in geheugen voor de huidige sessie.
- Geen Scaleway credentials in de browser.
- Presigned links verlopen na 90 seconden.
- Objectpad bevat alleen pseudonieme server-side owner-id.
- Cloud ontvangt de encrypted Vault snapshot, niet de decryptiesleutel.
- Voor productie: account/passkey-auth vervangt pilot-token.
- Voor productie: onafhankelijke securityreview, key rotation, device revocation en uitgebreide audit zijn verplicht.


## 7. Semantic event sync v0.8

De live multi-device laag gebruikt append-only encrypted eventsegmenten onder:

```
creabundalo/v2/<owner>/<vaultId>/events/<deviceId>/<seq>_<eventId>.enc.json
```

Event PUTs gebruiken `If-None-Match: *`, zodat een bestaand eventobject niet stil kan worden overschreven.

De volledige snapshot onder `creabundalo/v1/.../latest.enc.json` blijft alleen de herstelkopie.

Zie `SEMANTIC-CLOUD-SYNC.md` voor merge-, privacy- en schaalregels.
