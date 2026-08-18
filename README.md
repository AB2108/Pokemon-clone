# 🐟 FISCHMON

Ein Pokémon-Klon im Stil der **ersten Generation** (Game Boy) — nur dass alle
Kreaturen **Fischarten** sind. Optimiert fürs **Handy** mit Touch-Steuerung.

Reines HTML/CSS/JavaScript, keine Abhängigkeiten, kein Build-Schritt. Läuft in
jedem modernen Browser — einfach `index.html` öffnen.

## Spielen

- **Am Handy:** Datei auf dem Gerät öffnen oder die Seite hosten und im Browser
  aufrufen. Über „Zum Home-Bildschirm hinzufügen" startet das Spiel im Vollbild.
- **Am PC:** `index.html` doppelklicken.

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
index.html        Gerüst + Touch-Steuerung
css/style.css     Game-Boy-Gehäuse & Bedienelemente
js/data.js        Typen, Attacken, Fischarten, Karte, Begegnungen
js/sprites.js     Prozedurale Pixel-Grafik (Kacheln, Fische, Spieler)
js/ui.js          Text-, Fenster- und Menü-Bausteine
js/save.js        Speichern/Laden
js/battle.js      Statuswert-Mathematik & Kampfsystem
js/world.js       Karte, Bewegung, Begegnungen, Dialoge
js/game.js        Zustandsmaschine, Eingabe, Hauptschleife
```

## Tipp

Lauf mit deinem Starter in die **hellblauen Untiefen** am Wasserrand, um wilden
Fischen zu begegnen. Schwäche sie im Kampf und wirf dann ein **Netz** — je
niedriger die gegnerischen KP, desto höher die Fangchance. Elektro-Attacken sind
stark gegen alle Wasserfische, prallen aber an Panzer-Fischen ab.
