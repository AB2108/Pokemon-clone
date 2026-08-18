# 🐟 FISCHMON

Ein Pokémon-Klon im Stil der **ersten Generation** (Game Boy) — nur dass alle
Kreaturen **Fischarten** sind. Optimiert fürs **Handy** mit Touch-Steuerung.

Das Spiel selbst ist reines HTML/CSS/JavaScript (im Ordner `www/`) und wird per
**Capacitor** in eine echte **Android-App (.apk)** kompiliert.

## 📲 Als Android-App installieren (echtes APK)

Das APK wird automatisch von **GitHub Actions** gebaut (Workflow
`.github/workflows/android.yml`), weil dafür das Android-SDK nötig ist.

1. Nach jedem Push auf diesen Branch läuft der Build unter **Actions**.
2. Das fertige APK findest du danach unter **Releases** → *„Fischmon Android
   (neuester Build)"* → Datei **`fischmon.apk`** (Tag `android-latest`).
   Alternativ unter **Actions → letzter Lauf → Artifacts → `fischmon-apk`**.
3. `fischmon.apk` auf dem Handy herunterladen und öffnen. Android fragt nach
   *„Installation aus unbekannten Quellen erlauben"* → bestätigen.
4. App **Fischmon** starten. 🎣

> Es ist ein **Debug-APK** (mit Debug-Schlüssel signiert) — perfekt für die
> eigene Installation, aber nicht für den Play Store gedacht.

## 🌐 Im Browser spielen (ohne Build)

- **Am PC:** `www/index.html` doppelklicken.
- **Am Handy:** Ordner `www/` hosten (oder Datei öffnen) und im Browser aufrufen.

### Steuerung

| Aktion            | Touch          | Tastatur              |
|-------------------|----------------|-----------------------|
| Bewegen / Menü    | Steuerkreuz    | Pfeiltasten / W A S D |
| A (Bestätigen)    | roter A-Knopf  | `Z` oder `Enter`      |
| B (Zurück)        | roter B-Knopf  | `X`                   |
| Menü öffnen       | MENÜ           | `Umschalt` / `Esc`    |

## Features

- **Overworld** im Game-Boy-Look (4-Farben-Grünpalette) mit Stadt, Teich,
  Strand, Riff und Höhle.
- **Zufallsbegegnungen** in den blauen Untiefen — jede Zone hat eigene Fische.
- **Rundenbasierte Kämpfe** mit Typ-Effektivität (Fluss, Meer, Tiefsee, Elektro,
  Gift, Panzer, Räuber), Statuswert-Änderungen, Level-Aufstieg & Entwicklungen.
- **Fangen** wilder Fische mit **Netzen** (statt Pokébällen) in drei Stufen.
- **Fischdex** mit Gesehen-/Gefangen-Zähler und ein **Team**-Menü.
- **Speichern** im Browser (`localStorage`) — der Spielstand bleibt erhalten.
- Über **30 Fischarten** mit prozedural gezeichneten Pixel-Sprites.

### Starter

- **Guppy** (Fluss) → Piranja → Arapaima
- **Clownfisch** (Meer) → Engelfisch → Schwertfisch
- **Laternenfisch** (Tiefsee) → Anglerfisch → Schluckaal

## Aufbau

```
www/index.html        Gerüst + Touch-Steuerung
www/css/style.css     Game-Boy-Gehäuse & Bedienelemente
www/js/data.js        Typen, Attacken, Fischarten, Karte, Begegnungen
www/js/sprites.js     Prozedurale Pixel-Grafik (Kacheln, Fische, Spieler)
www/js/ui.js          Text-, Fenster- und Menü-Bausteine
www/js/save.js        Speichern/Laden
www/js/battle.js      Statuswert-Mathematik & Kampfsystem
www/js/world.js       Karte, Bewegung, Begegnungen, Dialoge
www/js/game.js        Zustandsmaschine, Eingabe, Hauptschleife

android/              Native Android-App (von Capacitor erzeugt)
capacitor.config.json Capacitor-Konfiguration (App-ID, Web-Ordner)
assets/               Quell-Grafik für App-Icon & Splash (1024 / 2732)
.github/workflows/    GitHub-Action, die das APK baut
```

## 🛠️ Selbst bauen (mit Android Studio / SDK)

Wer das Android-SDK lokal hat, kann das APK auch selbst bauen:

```bash
npm install
npx cap sync android
cd android
./gradlew assembleDebug
# Ergebnis: android/app/build/outputs/apk/debug/app-debug.apk
```

Oder `android/` in **Android Studio** öffnen und auf ▶ *Run* klicken.

Nach Änderungen am Spiel (`www/…`) immer `npx cap sync android` ausführen, damit
die Web-Dateien in die App kopiert werden. Icon/Splash neu erzeugen:
`npx @capacitor/assets generate --android`.

## Tipp

Lauf mit deinem Starter in die **hellblauen Untiefen** am Wasserrand, um wilden
Fischen zu begegnen. Schwäche sie im Kampf und wirf dann ein **Netz** — je
niedriger die gegnerischen KP, desto höher die Fangchance. Elektro-Attacken sind
stark gegen alle Wasserfische, prallen aber an Panzer-Fischen ab.
