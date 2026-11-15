# KI-Klassifikation · Entscheidungsbaum (ID3)

Überwachtes Lernen zum Zuschauen und Ausprobieren: Ein Entscheidungsbaum teilt die Trainingsdaten Schritt für Schritt nach dem Merkmal auf, das die Klassen am besten trennt – bis jedes Blatt nur noch eine Klasse enthält. Für jeden Knoten werden Entropie (oder Gini-Unreinheit) und Informationsgewinn aller Merkmale angezeigt, mit allen Zahlen. Wer will, wählt das Merkmal selbst und vergleicht mit dem Algorithmus.

Erstellt für den Unterricht an der Jakob-Preh-Schule ([bsnes.de](https://www.bsnes.de)).

**Live-Version:** [Hier direkt anschauen](https://flowthetensor.github.io/LS-Entscheidungsbaum/)

---

## Worum geht es?

Die Merkmale sind hier **Kategorien** (z. B. jung/alt, ok/fehlt), zu jeder Zeile ist die richtige Klasse bekannt (das „Label“). Am Ende steht ein Baum aus Wenn-dann-Fragen, den jeder Mensch lesen und nachprüfen kann. Das macht Entscheidungsbäume beliebt, wenn eine KI-Entscheidung **erklärbar** sein muss.

In der roten **Beispiel-Leiste** unter der Kopfzeile stehen drei Beispiele zur Verfügung. Reiter 1 ist das Beispiel aus dem Skript (Kap. 5.3), die anderen beiden kommen aus der Industrie. Zu jedem Beispiel gibt es eine **neue Anfrage**, die durch den fertigen Baum geschickt wird.

### 1. Skript · Kreditvergabe (Standard)

Die 10 Kunden einer Bank aus dem Skript:

| Merkmal | Werte |
|---|---|
| Alter | jung / alt |
| Einkommen | niedrig / hoch |
| Kredithistorie | schlecht / gut |
| Sicherheit | nein / ja |
| **Kredit?** | **ja / nein** |

Ergebnis mit Entropie: Zuerst wird nach **Einkommen** geteilt (IG = 0,610 bit). Bei hohem Einkommen gibt es immer einen Kredit, bei niedrigem entscheidet die **Kredithistorie**. Alter und Sicherheit werden gar nicht gebraucht. Anfrage: jung, niedriges Einkommen, gute Kredithistorie, keine Sicherheit → Kredit **ja**.

### 2. Prüfstation · Gutteil oder Ausschuss?

Prüfprotokoll der Modellanlage mit 14 Werkstücken:

| Merkmal | Werte |
|---|---|
| Farbe | rot / schwarz / silber |
| Höhe | ok / zu niedrig |
| Bohrung | ok / fehlt |
| Oberfläche | glatt / Kratzer |
| **Ergebnis** | **Gutteil / Ausschuss** |

Falsche Höhe oder fehlende Bohrung bedeutet immer Ausschuss. Silberne Teile sind **Sichtteile** – dort ist schon ein Kratzer zu viel, bei roten und schwarzen Teilen nicht. Der Baum muss deshalb Farbe und Oberfläche **kombinieren** und wird vier Ebenen tief. Am Wurzelknoten gibt es einen **Gleichstand** (Höhe und Bohrung je IG = 0,257 bit), dann wird das erste Merkmal genommen. Anfrage: silber, Höhe ok, Bohrung ok, Kratzer → **Ausschuss**.

### 3. Pumpe · Wartung fällig?

Zustandsdaten von 14 Kühlmittelpumpen:

| Merkmal | Werte |
|---|---|
| Betriebsstunden | niedrig / mittel / hoch |
| Vibration | normal / erhöht |
| Temperatur | normal / hoch |
| Ölstand | ok / niedrig |
| **Wartung?** | **nein / ja** |

Ein niedriger Ölstand bedeutet immer Wartung, deshalb steht der **Ölstand** an der Wurzel. Danach kommt es auf die Betriebsstunden an – und erst bei mittleren und hohen Betriebsstunden auf die Vibration. Die Temperatur allein bringt an der Wurzel gar keinen Informationsgewinn (IG = 0). Anfrage: mittlere Betriebsstunden, erhöhte Vibration, Temperatur normal, Ölstand ok → Wartung **ja**.

## Der ID3-Algorithmus

```
① Unreinheit des Knotens berechnen
② Informationsgewinn für jedes noch nicht benutzte Merkmal berechnen
③ nach dem Merkmal mit dem größten Informationsgewinn aufteilen
④ für jeden neuen Ast wieder bei ① beginnen, bis alle Blätter rein sind
```

Ein Knoten wird zum **Blatt**, wenn er rein ist (nur eine Klasse), wenn keine Merkmale mehr übrig sind, wenn die maximale Tiefe erreicht ist oder wenn kein Merkmal mehr Informationsgewinn bringt. Nicht reine Blätter bekommen die Mehrheitsklasse, leere Blätter die Mehrheit des Elternknotens.

### Unreinheit

Eine Menge $S$ mit den Klassenanteilen $P(c)$:

**Entropie** (in bit; $0 \cdot \log_2 0 := 0$):

$$H(S) = -\sum_c P(c) \cdot \log_2 P(c)$$

**Gini-Unreinheit:**

$$\text{Gini}(S) = 1 - \sum_c P(c)^2$$

Beide sind 0, wenn nur eine Klasse vorkommt, und am größten, wenn alle Klassen gleich häufig sind (Entropie bei zwei Klassen: 1 bit, Gini: 0,5).

### Informationsgewinn

Wie viel Unreinheit verschwindet, wenn man nach Merkmal $A$ aufteilt? Die Teilmengen $S_i$ werden nach ihrer Größe gewichtet:

$$IG(S, A) = H(S) - \sum_i \frac{|S_i|}{|S|} \cdot H(S_i)$$

Beispiel Kreditvergabe, Wurzel: 7 × ja, 3 × nein → $H = 0{,}971$ bit. Nach Einkommen geteilt: hoch (5 × ja, rein, $H = 0$) und niedrig (1 × ja, 4 × nein, $H = 0{,}722$):

$$IG = 0{,}971 - \tfrac{5}{10} \cdot 0 - \tfrac{5}{10} \cdot 0{,}722 \approx 0{,}610 \text{ bit}$$

Das ist der größte Informationsgewinn aller vier Merkmale – deshalb steht Einkommen an der Wurzel.

### Selbst wählen

Im Modus „selbst wählen“ klickt man im Feld „Informationsgewinn“ auf ein Merkmal und teilt danach auf – auch auf ein schlechtes. So sieht man, dass ein ungünstiges erstes Merkmal zu einem größeren Baum führt.

## Bedienung

| Aktion | Wirkung |
|---|---|
| Beispiel-Leiste (Reiter 1–3) | Kreditvergabe, Prüfstation oder Pumpe |
| **→** oder „Schritt“ | nächster Schritt: Knoten analysieren · aufteilen |
| **Leertaste** oder „Automatisch“ | bis zum fertigen Baum durchlaufen lassen / anhalten |
| **R** oder „Neu starten“ | wieder bei der Wurzel beginnen |
| „Baum sofort bauen“ | den ganzen Baum auf einmal erzeugen |
| Klick auf einen Knoten | ihn genauer ansehen (Daten, Unreinheit, Informationsgewinn) |
| Klick auf ein Merkmal im Feld „Informationsgewinn“ | danach aufteilen (Modus „selbst wählen“) |
| Klick auf einen Wert der Anfrage | Wert wechseln – der Weg durch den Baum ändert sich sofort |
| Maus über Knoten, Tabelle und Werte | Erklärungen und zugehörige Zeilen |

**Einstellungen:** Unreinheitsmaß (Entropie / Gini-Unreinheit), Aufteilen (automatisch: größter IG / selbst wählen), Tempo, maximale Tiefe (unbegrenzt, 1, 2 oder 3 Ebenen). „CSV speichern“ lädt die Trainingsdaten herunter (z. B. für Excel oder Python).

## Ideen für den Unterricht

- **Von Hand rechnen:** Entropie der Wurzel beim Kredit-Beispiel auf Papier berechnen, dann den Informationsgewinn von Einkommen und Alter. Warum ist IG(Alter) = 0?
- **Selbst wählen:** Zuerst nach *Sicherheit* aufteilen statt nach Einkommen. Wie groß wird der Baum? Was sagt das über den Informationsgewinn?
- **Entropie oder Gini:** Beide Maße ausprobieren. Ändert sich der Baum? Ändern sich die Zahlen?
- **Wenn-dann-Regeln:** Den fertigen Baum als Regeln aufschreiben („Wenn Einkommen niedrig und Kredithistorie schlecht, dann kein Kredit“). Wie viele Regeln entstehen? Könnte man sie direkt in einer SPS programmieren?
- **Sichtteile:** Warum steht *Farbe* bei der Prüfstation erst in der dritten Ebene? Welche Zeilen sorgen dafür, dass der Baum so tief wird?
- **Gleichstand:** An der Wurzel der Prüfstation haben Höhe und Bohrung denselben Informationsgewinn. Mit „selbst wählen“ beide Varianten bauen – wird der Baum anders?
- **Wartung:** Warum hat die Temperatur an der Wurzel IG = 0, obwohl sie weiter unten doch noch wichtig wird?
- **Maximale Tiefe:** Mit 1, 2 und 3 Ebenen bauen. Wie viele Trainingszeilen landen in einem falschen Blatt? Warum begrenzt man die Tiefe trotzdem oft? (Überanpassung, Lesbarkeit)
- **Anfrage verändern:** Werte der Anfrage durchklicken. Welche Merkmale ändern das Ergebnis, welche nicht?
- **Fairness:** Beim Kredit-Beispiel spielt das Alter keine Rolle. Was wäre, wenn doch? Warum ist Erklärbarkeit bei solchen Entscheidungen wichtig?
- **Weiterarbeit:** Daten als CSV speichern und in Python mit `sklearn.tree.DecisionTreeClassifier(criterion="entropy")` nachrechnen.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seite, bindet Schriften, p5.js und die Skripte ein |
| `style.css` | Gestaltung im Corporate Design der Schule |
| `basis.js` | gemeinsame Grundlage aller KI-Klassifikations-Seiten (Layout, Farben, Kopfzeile, Beispiel-Leiste, UI-Helfer) |
| `daten.js` | alle drei Beispiele (Merkmale mit Werten, Zielklasse, Trainingszeilen, Anfrage) |
| `baum.js` | der Algorithmus – Entropie, Gini, Informationsgewinn, Knoten, Pfad einer Anfrage – reines JavaScript, ohne p5 |
| `ui.js` | Knöpfe und Auswahllisten |
| `sketch.js` | Ablauf, Zeichnen des Baums, Erklärtexte |
| `assets/logo-jps.png` | Logo der Jakob-Preh-Schule |
| `libraries/p5.min.js` | p5.js (lokal, damit die Seite auch offline läuft) |

Ein weiteres Beispiel lässt sich ergänzen, indem man in `daten.js` einen Eintrag in `SZENARIEN` hinzufügt (Merkmale mit ihren Werten, Zielklasse mit Farben, Trainingszeilen im Klartext, Anfrage). Es erscheint dann automatisch als weiterer Reiter in der Beispiel-Leiste. Tippfehler in den Werten werden beim Laden gemeldet.

## Lokal starten

Am einfachsten in VS Code mit der Erweiterung **Live Server**: Rechtsklick auf `index.html` → „Open with Live Server“.

## Technische Hinweise

- Läuft mit **p5.js 1.x** (lokal mitgeliefert) und **p5.js 2.x**. Dafür verzichtet der Code bewusst auf Funktionen, die sich zwischen den Versionen geändert haben (z. B. `preload`, `loadFont`).
- Die Schriften (Quicksand, Inter, JetBrains Mono) kommen von Google Fonts. Ohne Internet weicht die Seite automatisch auf Systemschriften aus.
- Alle Schleifen haben geschweifte Klammern: Der p5-Web-Editor baut in Schleifen eine Endlosschleifen-Sicherung ein, die bei Schleifen ohne Klammern fehlschlägt.
- Fehler in `draw()` werden abgefangen und als Hinweis angezeigt, statt das Programm einzufrieren.
- Die Trainingsdaten stehen in `daten.js` im Klartext („jung“, „hoch“ …) und werden beim Laden in Zahlen umgewandelt.
- `basis.js` ist in allen KI-Klassifikations-Seiten (Logistische Regression, kNN, Naiver Bayes, Entscheidungsbaum) identisch.

## Lizenz

[![CC BY 4.0](https://img.shields.io/badge/Lizenz-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/deed.de)

**KI-Klassifikation · Entscheidungsbaum (ID3)** von **Christoph Rothaug, Jakob-Preh-Schule Bad Neustadt**, steht unter der Lizenz [Creative Commons Namensnennung 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/deed.de). Der vollständige Lizenztext steht in der Datei [`LICENSE`](LICENSE).

Du darfst das Material (Quellcode, Texte, Aufgaben und Grafiken) kopieren, weitergeben und verändern, auch kommerziell. Dafür musst du

- den Urheber nennen: *Christoph Rothaug, Jakob-Preh-Schule Bad Neustadt*,
- auf die Lizenz verlinken: <https://creativecommons.org/licenses/by/4.0/deed.de>,
- angeben, ob du etwas verändert hast.

Vorschlag für die Namensnennung: *„KI-Klassifikation · Entscheidungsbaum (ID3)“ von Christoph Rothaug, Jakob-Preh-Schule Bad Neustadt, CC BY 4.0, https://github.com/FlowTheTensor/LS-Entscheidungsbaum*

**Ausgenommen** von dieser Lizenz sind:

| Bestandteil | Rechte |
|---|---|
| `libraries/p5.min.js` | [p5.js](https://p5js.org), GNU LGPL 2.1 |
| `assets/logo-jps.png` | Logo der Jakob-Preh-Schule – alle Rechte bei der Schule |
| Schriften Quicksand, Inter, JetBrains Mono | über Google Fonts eingebunden, SIL Open Font License 1.1 |
