# Publier SCP Audio

Ce document rassemble **les décisions prises** pour ouvrir le dépôt et **la
marche à suivre** pour diffuser l'application — sur le web, puis sur Android.

---

## 1. Les décisions, et pourquoi

| Sujet | Décision | Raison |
|---|---|---|
| Licence du code | **MIT** | Courte, permissive, comprise de tous. Elle ne couvre que le code : le contenu SCP reste CC BY-SA 3.0 (voir [NOTICE-SCP.md](NOTICE-SCP.md)). |
| Hébergement principal | **Vercel** | C'est le seul choix qui préserve les voix neurales pour tout le monde : une fonction serverless porte `/api/tts`, et sans elle Chrome et Firefox retombent sur la voix du navigateur. |
| Hébergement secondaire | **GitHub Pages** | Un miroir de démonstration, lié depuis le dépôt. Il appelle la fonction Vercel via `VITE_TTS_ENDPOINT`, donc il garde lui aussi les voix. |
| Empaquetage Android | **Capacitor** (déjà en place) | `overrideUserAgent` y fait passer la WebView pour Edge, et c'est *la* raison pour laquelle le téléphone a des voix neurales. Une Trusted Web Activity (Bubblewrap, PWA Builder) ne peut pas changer son User-Agent : elle perdrait exactement ce qui fait l'intérêt de l'application. |
| Partage immédiat | **APK en GitHub Release** | Le Play Store demande un compte développeur, des visuels et un délai de validation. Un APK attaché à une release s'installe le jour même. |
| Secrets | **aucun** | Ni Edge TTS ni l'API Crom ne demandent de clé. Le déploiement n'a aucune variable secrète, et c'est une propriété à préserver. |

---

## 2. Web — Vercel

```bash
npm i -g vercel
vercel login
vercel          # déploiement d'aperçu, pour vérifier
vercel --prod   # production
```

Ou, plus simple : sur [vercel.com](https://vercel.com), « Add New → Project »,
importer `atari643/scp-audio-roleplay`. Tout est déjà décrit dans
[`vercel.json`](vercel.json) — commande de build, dossier de sortie, réécriture
SPA, durée maximale de la fonction.

**Rien à configurer côté variables d'environnement.** Le plan Hobby est gratuit à
vie et **ne demande aucune carte bancaire** : en cas de dépassement de quota, le
service se met en pause, il n'y a rien à prélever. Les quotas — 1 million d'appels
et 4 h de CPU réel par mois — sont hors d'atteinte pour cet usage, d'autant que les
réponses sont mises en cache par le réseau de diffusion (`s-maxage`) et que le
client garde déjà l'audio en IndexedDB.

### Le relais est verrouillé

`api/tts.ts` n'accepte que les origines du projet (le miroir Pages, le déploiement
Vercel lui-même lu dans `VERCEL_URL`, et `localhost` pour le développement), et
refuse en `403` **avant de synthétiser** — un relais ouvert serait un service de
synthèse gratuit offert à qui le découvre, facturé sur votre quota. Les textes de
plus de 3 000 caractères sont refusés en `413` ; c'est plus de trois fois le
segment le plus long mesuré sur le corpus (903 caractères).

Ces deux verrous vivent **uniquement** dans `api/tts.ts`. Un clone hébergé en local
(`npm run dev`, `npm run serve`) n'est ni filtré ni plafonné : il se comporte
exactement comme avant.

### Plan B : Cloudflare Workers

Si Vercel posait problème, Workers convient aussi (gratuit, sans carte, 100 000
requêtes par jour) et supporte le WebSocket sortant avec en-têtes personnalisés via
`fetch(url, { headers: { Upgrade: 'websocket' } })` puis `response.webSocket`. Il
faudrait alors un adaptateur dans `src/services/edgeTts.ts`, dont `openSocket()`
utilise aujourd'hui l'extension `new WebSocket(url, { headers })` propre à Node.
Ce n'est pas implémenté : Vercel réutilise le code du serveur local tel quel, ce qui
garantit que le relais ne dérive jamais du comportement local.

### Vérifier que les voix neurales passent

Ouvrez un dossier dans **Chrome** (pas Edge), onglet Réseau des outils de
développement : vous devez voir des requêtes `/api/tts` en 200. Si elles sont en
404 ou 502, l'application bascule sur `speechSynthesis` et toutes les voix se
ressemblent — c'est le symptôme à surveiller.

Le délai d'attente de la synthèse est de 20 s ; `vercel.json` accorde 30 s à la
fonction. Sur un plan gratuit, la limite par défaut est de 10 s : c'est
exactement ce que ce réglage corrige.

## 3. Web — miroir GitHub Pages

Une fois le dépôt public :

1. **Réglages → Pages → Source : GitHub Actions**.
2. **Réglages → Secrets and variables → Actions → Variables → New variable** :
   - nom : `VITE_TTS_ENDPOINT`
   - valeur : `https://<votre-projet>.vercel.app/api/tts`
3. Poussez sur `main`, ou lancez le workflow « Miroir GitHub Pages » à la main.

Sans cette variable, le miroir fonctionne quand même, mais seuls Edge et
l'application Android y ont les voix neurales.

---

## 4. Android — de zéro à l'APK

### Prérequis

- **Android Studio** (ou, au minimum, le SDK Android et un JDK 21).
- `ANDROID_HOME` renseigné, ou `android/local.properties` contenant
  `sdk.dir=C\:\\Users\\<vous>\\AppData\\Local\\Android\\Sdk`.

### APK de test

```bash
npm run android:debug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

Cet APK s'installe sur n'importe quel téléphone dont on a autorisé les
« sources inconnues ». C'est le chemin le plus court pour faire essayer
l'application à quelqu'un. Le workflow « APK Android » produit le même fichier
en artefact GitHub, et l'attache à une release quand vous poussez un tag `v*` :

```bash
git tag v1.0.0 && git push origin v1.0.0
```

### Créer la clé de signature — une seule fois, pour toujours

```bash
keytool -genkey -v -keystore android/scp-audio.jks -keyalg RSA \
  -keysize 2048 -validity 10000 -alias scp-audio
```

Puis copiez `android/keystore.properties.exemple` en
`android/keystore.properties` et remplissez les quatre valeurs.

> ⚠️ **Le fichier `.jks` et ces mots de passe sont irremplaçables.** C'est cette
> clé, et elle seule, qui prouve au Play Store que les mises à jour viennent de
> vous. La perdre, c'est ne plus jamais pouvoir mettre l'application à jour :
> il faudrait la republier sous un autre identifiant, en perdant les
> installations existantes. Sauvegardez-la hors du projet, dans un gestionnaire
> de mots de passe ou sur un support chiffré.
>
> `android/.gitignore` exclut `*.jks`, `*.keystore` et `keystore.properties`, et
> le hook `pre-commit` refuse de les indexer. Ne contournez ni l'un ni l'autre.

### Le paquet pour le Play Store

```bash
npm run android:release
# → android/app/build/outputs/bundle/release/app-release.aab
```

Le Play Store veut un **AAB**, pas un APK.

### Avant chaque publication

Dans `android/app/build.gradle`, incrémentez :

```gradle
versionCode 2        // entier, strictement croissant à chaque envoi
versionName "1.1"    // ce que voit l'utilisateur
```

Google refuse un `versionCode` déjà utilisé, même pour une version de test.

---

## 5. Android — la fiche Play Store

### Compte

Compte développeur Google Play : **25 $ une fois**, sur
[play.google.com/console](https://play.google.com/console). Depuis 2023, un
compte personnel doit en plus faire vérifier son identité, et une première
application peut demander une phase de test fermé. Comptez quelques jours.

### Visuels — déjà générés

| Élément | Où le trouver |
|---|---|
| Icône 512 × 512 | `public/icones/play-512.png` |
| Icône du lanceur | `android/app/src/main/res/mipmap-*/` |
| Écran de démarrage | `android/app/src/main/res/drawable-*/splash.png` |

`npm run icones` régénère l'ensemble depuis le sceau. Restent à faire à la main :
la **bannière 1024 × 500** et **deux captures d'écran minimum** par format
(téléphone obligatoire).

### Formulaire « Sécurité des données »

À remplir honnêtement, et c'est simple ici :

- **Aucune donnée collectée.** Favoris, historique, file de lecture et profils de
  voix vivent dans le `localStorage` du téléphone ; l'audio déjà synthétisé est
  en IndexedDB. Rien ne part vers un serveur du développeur.
- **Aucune donnée partagée avec des tiers.**
- L'application contacte deux services externes pour fonctionner : l'API Crom
  (pour le texte des dossiers) et le service de lecture à voix haute de
  Microsoft (pour la voix). Le texte envoyé à la synthèse est celui du dossier
  public, jamais une donnée personnelle.

Une **politique de confidentialité en ligne est obligatoire** : l'URL de
[NOTICE-SCP.md](NOTICE-SCP.md) sur GitHub, ou une page dédiée du miroir Pages,
fait l'affaire à condition d'y reprendre les points ci-dessus.

### Description et classification

- Mentionner dans la description que c'est un **projet de fan, non officiel**,
  que le contenu vient du wiki SCP sous **CC BY-SA 3.0**, et donner le lien vers
  le wiki. C'est une obligation de la licence, et cela évite aussi le soupçon
  d'usurpation de marque.
- Classification du contenu : l'univers SCP comporte de la violence et des
  thèmes dérangeants. Répondez franchement au questionnaire — une classification
  sous-évaluée est un motif de retrait.

---

## 6. Rendre le dépôt public — la dernière étape

À faire **après** avoir relu ce qui part :

```bash
git status                       # rien d'inattendu ?
git ls-files | grep -iE 'env|keystore|jks|bascule'   # doit être vide
git push -u origin main
gh repo edit atari643/scp-audio-roleplay --visibility public
```

Puis, dans les réglages GitHub du dépôt :

- **Security → Secret scanning** et **Push protection** : gratuits sur un dépôt
  public, ils refusent une poussée contenant une clé connue. Activez les deux.
- **Pages → Source : GitHub Actions** (voir section 3).
- Dans « About », mettez l'URL Vercel — c'est le premier lien que voit un
  visiteur.
