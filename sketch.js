// =============================================================================
//  KI-Klassifikation · Entscheidungsbaum (ID3)
//  Die Trainingsdaten werden Schritt für Schritt nach dem Merkmal aufgeteilt,
//  das den größten Informationsgewinn bringt – bis alle Blätter rein sind.
//  Drei Beispiele zur Auswahl:
//    - Skript 5.3: Kreditvergabe einer Bank (10 Kunden)
//    - Prüfstation: Farbe, Höhe, Bohrung, Oberfläche → Gutteil / Ausschuss
//    - Instandhaltung: Betriebsstunden, Vibration, Temperatur, Ölstand → Wartung?
// =============================================================================
//
//  Dateien
//    basis.js        gemeinsame Grundlage (Layout, Farben, Kopfzeile, UI-Helfer)
//    daten.js        Trainingsdaten der drei Beispiele
//    baum.js         der Algorithmus (Entropie, Gini, Informationsgewinn, Knoten)
//    ui.js           Knöpfe und Auswahllisten
//    sketch.js       Ablauf, Zeichnen, Erklärungen (diese Datei)
//
//  Ablauf je Knoten
//    ① Unreinheit und Informationsgewinn aller Merkmale berechnen
//    ② ist der Knoten rein → Blatt
//    ③ sonst nach dem besten Merkmal aufteilen (oder selbst eins anklicken)
//
//  Bedienung
//    →         nächster Schritt
//    Leertaste automatisch ablaufen lassen / anhalten
//    R         neu starten
//    Klick     auf einen Knoten: ihn genauer ansehen
//    Klick     auf ein Merkmal im Feld „Informationsgewinn“: danach aufteilen
//    Klick     auf einen Wert der Anfrage: Wert wechseln
// =============================================================================

const APP_TITEL = "KI-Klassifikation";

const P_DATEN = { x: 24, y: 84, w: 820, h: 800, titel: "" };
const P_ERKL = { x: 860, y: 84, w: 716, h: 244, titel: "" };
const P_EINST = { x: 860, y: 344, w: 716, h: 132, titel: "Einstellungen" };
const P_IG = { x: 860, y: 492, w: 716, h: 184, titel: "" };
const P_UNREIN = { x: 860, y: 692, w: 350, h: 192, titel: "" };
const P_ANFRAGE = { x: 1226, y: 692, w: 350, h: 192, titel: "Neue Anfrage" };

const BAUM = { x: 44, y: 132, w: 780, h: 372 };
const KNOTEN_H = 48;
const T_Y = 532; // Überschrift der Datentabelle
const SCHRITT_PAUSE = { langsam: 2400, mittel: 1300, schnell: 450 };

// -----------------------------------------------------------------------------
// Zustand
// -----------------------------------------------------------------------------
let szenario = "skript";
let daten = [];
let wurzel = null;
let warteschlange = [];
let fokus = null; // angezeigter Knoten
let fertig = false;

let mass = "entropie";
let modus = "auto";
let maxTiefe = 0;
let tempo = "mittel";

let laufAuto = false;
let letzterSchritt = 0;

let anfrageWerte = [];
let zonen = [];
let zonenFertig = [];

// =============================================================================
// Start
// =============================================================================
function setup() {
  ladeSchriften();
  const [cw, ch] = zeichenflaeche();
  cnv = createCanvas(cw, ch);
  S = width / W;

  szenarioLaden("skript");
  erstelleUi();
  cnv.parent(huelle);
  layoutUi();
}

function nachFehler() {
  laufAuto = false;
}

// =============================================================================
// Hauptschleife
// =============================================================================
function draw() {
  try {
    logik();
    zonen = [];
    zeichneRahmen(() => {
      zeichneStatusZeile(statusText());
      zeichneDatenPanel();
      zeichneErklaerung();
      zeichneEinstellungen();
      zeichneIG();
      zeichneUnreinheit();
      zeichneAnfrage();
      zeichneTooltip();
    });
    zonenFertig = zonen;
    aktualisiereUi();
    const z = zoneUnterMaus();
    cursor(z && z.klick ? HAND : ARROW);
  } catch (err) {
    behandleFehler(err);
  }
}

function logik() {
  if (laufAuto && millis() - letzterSchritt > SCHRITT_PAUSE[tempo]) {
    if (wartetAufWahl() && modus === "selbst") {
      laufAuto = false;
      zeigeHinweis("Du bist dran: Klicke im Feld „Informationsgewinn“ auf das Merkmal, nach dem geteilt werden soll.");
    } else {
      schritt();
    }
  }
  if (fertig) {
    laufAuto = false;
  }
}

// =============================================================================
// Daten und Ablauf
// =============================================================================
function szenarioLaden(id) {
  szenario = id;
  setzeSzenario(id);
  daten = erzeugeDaten();
  anfrageWerte = SZ.anfrage.map((w, j) => SZ.merkmale[j].werte.indexOf(w));
  neuStarten();
}

function szenarioWechseln(id) {
  if (laufAuto || id === szenario) {
    return;
  }
  szenarioLaden(id);
}

function neuStarten() {
  laufAuto = false;
  knotenZaehler = 0;
  wurzel = neuerKnoten(daten.slice(), 0, SZ.merkmale.map((_, j) => j), null, null);
  warteschlange = [wurzel];
  fokus = wurzel;
  fertig = false;
}

// Der vorderste Knoten der Warteschlange ist berechnet und wartet aufs Aufteilen
function wartetAufWahl() {
  const k = warteschlange[0];
  return !!(k && k.analyse && !k.blatt && k.split === null);
}

function schritt() {
  letzterSchritt = millis();
  if (fertig || warteschlange.length === 0) {
    return;
  }
  const k = warteschlange[0];
  if (!k.analyse) {
    analysiere(k, mass, maxTiefe);
    fokus = k;
    if (k.blatt) {
      warteschlange.shift();
      pruefeFertig();
    }
    return;
  }
  if (modus === "selbst") {
    zeigeHinweis("Klicke im Feld „Informationsgewinn“ auf das Merkmal, nach dem geteilt werden soll.");
    return;
  }
  aufteilen(k, k.analyse.bester.j);
}

function aufteilen(k, j) {
  splitte(k, j);
  warteschlange.shift();
  warteschlange.push(...k.kinder);
  fokus = k;
  letzterSchritt = millis();
  pruefeFertig();
}

function pruefeFertig() {
  if (warteschlange.length === 0) {
    fertig = true;
    laufAuto = false;
  }
}

function autoUmschalten() {
  if (laufAuto) {
    laufAuto = false;
    return;
  }
  if (fertig) {
    return;
  }
  laufAuto = true;
  letzterSchritt = millis() - SCHRITT_PAUSE[tempo] + 250;
}

function baumKomplett() {
  let sicherung = 0;
  while (!fertig && sicherung < 500) {
    const k = warteschlange[0];
    if (!k.analyse) {
      analysiere(k, mass, maxTiefe);
      if (k.blatt) {
        warteschlange.shift();
        pruefeFertig();
      }
    } else {
      aufteilen(k, k.analyse.bester.j);
    }
    sicherung++;
  }
  fokus = wurzel;
}

// =============================================================================
// Zahlen und Texte
// =============================================================================
function f3(v) {
  return fKomma(v, 3);
}

function massName() {
  return mass === "gini" ? "Gini" : "H";
}

function verteilungText(anzahl) {
  return anzahl.map((a, k) => `${a}× ${SZ.ziel.werte[k]}`).join(" · ");
}

// Rechenweg der Unreinheit mit Brüchen
function unreinheitFormel(anzahl) {
  const n = anzahl.reduce((a, b) => a + b, 0);
  const wert = unreinheit(anzahl, mass);
  if (n === 0) {
    return `${massName()} = 0 (leer)`;
  }
  if (mass === "gini") {
    return `Gini = 1 − (${anzahl.map((a) => `(${a}/${n})²`).join(" + ")}) = ${f3(wert)}`;
  }
  const terme = anzahl.filter((a) => a > 0).map((a) => `${a}/${n}·log₂(${a}/${n})`);
  return `H = −(${terme.join(" + ")}) = ${f3(wert)}`;
}

function igFormel(g, n) {
  const teile = g.teilmengen.map((t) => `${t.zeilen.length}/${n}·${f3(t.h)}`);
  return `IG(${SZ.merkmale[g.j].name}) = ${f3(g.h)} − ${teile.join(" − ")} = ${f3(g.ig)}`;
}

// Beschreibung eines Knotens über seinen Pfad, z. B. "Einkommen = niedrig"
function knotenName(k) {
  if (!k.eltern) {
    return "Wurzel";
  }
  const teile = [];
  let x = k;
  while (x.eltern) {
    teile.unshift(`${SZ.merkmale[x.eltern.split].name} = ${SZ.merkmale[x.eltern.split].werte[x.wert]}`);
    x = x.eltern;
  }
  return teile.join(" → ");
}

function alleKnoten() {
  const liste = [];
  const besuche = (k) => {
    liste.push(k);
    for (const c of k.kinder) {
      besuche(c);
    }
  };
  besuche(wurzel);
  return liste;
}

function trainingsGenauigkeit() {
  let richtig = 0;
  for (const z of daten) {
    const p = pfad(wurzel, z.m);
    const letzter = p[p.length - 1];
    if (letzter.blatt && letzter.klasse === z.k) {
      richtig++;
    }
  }
  return richtig / daten.length;
}

function statusText() {
  const knoten = alleKnoten();
  const blaetter = knoten.filter((k) => k.blatt).length;
  let tiefe = 0;
  for (const k of knoten) {
    tiefe = Math.max(tiefe, k.tiefe);
  }
  let s = `${daten.length} ${SZ.wort.mehrzahl} mit bekannter Klasse · ${SZ.merkmale.length} Merkmale · Maß: ${mass === "gini" ? "Gini-Unreinheit" : "Entropie"} · ${knoten.length} Knoten, davon ${blaetter} Blätter · Tiefe ${tiefe}`;
  if (fertig) {
    s += ` · Trainingsgenauigkeit ${prozent(trainingsGenauigkeit(), 0)} · fertig ✓`;
  }
  return s;
}

// =============================================================================
// Klickzonen
// =============================================================================
function zone(x, y, w, h, daten) {
  zonen.push({ x, y, w, h, ...daten });
}

function zoneUnterMaus() {
  const mx = mausX();
  const my = mausY();
  for (let i = zonenFertig.length - 1; i >= 0; i--) {
    const z = zonenFertig[i];
    if (mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h) {
      return z;
    }
  }
  return null;
}

// =============================================================================
// Baum zeichnen
// =============================================================================
// Anzahl der Blätter unter einem Knoten (offene Knoten zählen als Blatt)
function breiteIn(k) {
  if (k.kinder.length === 0) {
    return 1;
  }
  let s = 0;
  for (const c of k.kinder) {
    s += breiteIn(c);
  }
  return s;
}

function maxTiefeIn(k) {
  let t = k.tiefe;
  for (const c of k.kinder) {
    t = Math.max(t, maxTiefeIn(c));
  }
  return t;
}

function layoutBaum() {
  const blaetter = breiteIn(wurzel);
  const ebenen = maxTiefeIn(wurzel);
  const einheit = BAUM.w / blaetter;
  const dy = ebenen > 0 ? Math.min(118, (BAUM.h - KNOTEN_H - 10) / ebenen) : 0;
  const bw = Math.max(70, Math.min(150, einheit - 10));
  const setze = (k, links) => {
    const b = breiteIn(k);
    k.px = BAUM.x + (links + b / 2) * einheit;
    k.py = BAUM.y + 6 + k.tiefe * dy;
    k.bw = bw;
    let l = links;
    for (const c of k.kinder) {
      setze(c, l);
      l += breiteIn(c);
    }
  };
  setze(wurzel, 0);
}

function zeichneBaum() {
  layoutBaum();
  const knoten = alleKnoten();
  const weg = new Set(pfad(wurzel, anfrageWerte));

  // Kanten
  for (const k of knoten) {
    for (const c of k.kinder) {
      const aufWeg = weg.has(k) && weg.has(c);
      stroke(...(aufWeg ? FARBE.senf : FARBE.neutral));
      strokeWeight(aufWeg ? 4 : 1.6);
      line(k.px, k.py + KNOTEN_H, c.px, c.py);
    }
  }
  // Kantenbeschriftung
  for (const k of knoten) {
    for (const c of k.kinder) {
      const mx = (k.px + c.px) / 2;
      const my = (k.py + KNOTEN_H + c.py) / 2;
      const s = SZ.merkmale[k.split].werte[c.wert];
      textFont(SCHRIFT);
      textSize(11.5);
      const w = textWidth(s) + 12;
      noStroke();
      fill(...FARBE.flaeche);
      rect(mx - w / 2, my - 9, w, 18, 9);
      fill(...FARBE.grau);
      textAlign(CENTER, CENTER);
      text(s, mx, my);
    }
  }
  // Knoten
  for (const k of knoten) {
    zeichneKnoten(k, weg.has(k));
  }
}

function zeichneKnoten(k, aufWeg) {
  const x = k.px - k.bw / 2;
  const y = k.py;
  const w = k.bw;
  const h = KNOTEN_H;
  const istFokus = k === fokus;
  const anzahl = verteilung(k.zeilen, SZ.ziel.werte.length);

  noStroke();
  fill(...FARBE.schatten, 18);
  rect(x + 1, y + 3, w, h, 10);
  if (k.blatt) {
    const f = SZ.ziel.farben[k.klasse];
    fill(f[0], f[1], f[2], 34);
    stroke(...f);
  } else if (k.split !== null) {
    fill(...FARBE.flaeche);
    stroke(...FARBE.text);
  } else {
    fill(...FARBE.papier);
    stroke(...FARBE.neutral);
  }
  strokeWeight(1.6);
  if (!k.analyse) {
    gestrichelt(true);
  }
  rect(x, y, w, h, 10);
  gestrichelt(false);
  if (istFokus) {
    noFill();
    stroke(...FARBE.senf);
    strokeWeight(3.5);
    rect(x - 4, y - 4, w + 8, h + 8, 13);
  } else if (aufWeg) {
    noFill();
    stroke(...FARBE.senf);
    strokeWeight(2);
    rect(x - 2, y - 2, w + 4, h + 4, 11);
  }

  // Text
  noStroke();
  textAlign(CENTER, CENTER);
  let titel;
  let farbeTitel = FARBE.text;
  if (k.blatt) {
    titel = SZ.ziel.werte[k.klasse];
    farbeTitel = SZ.ziel.farben[k.klasse];
  } else if (k.split !== null) {
    titel = SZ.merkmale[k.split].name;
  } else if (k.analyse) {
    titel = `${massName()} = ${f3(k.analyse.h)}`;
  } else {
    titel = "?";
  }
  fill(...farbeTitel);
  textFont(SCHRIFT);
  textStyle(BOLD);
  textSize(k.bw < 100 ? 12 : 13.5);
  text(titel, k.px, y + 16);
  textStyle(NORMAL);

  // Klassenverteilung als kleiner Balken
  const n = k.zeilen.length;
  const bx = x + 10;
  const bw = w - 20;
  const by = y + 26;
  if (n > 0) {
    let lx = bx;
    anzahl.forEach((a, i) => {
      const f = SZ.ziel.farben[i];
      fill(f[0], f[1], f[2], 200);
      rect(lx, by, (bw * a) / n, 7);
      lx += (bw * a) / n;
    });
  }
  fill(...FARBE.grau);
  textFont(MONO);
  textSize(10);
  text(n > 0 ? anzahl.join(" | ") : "leer", k.px, y + h - 6);

  zone(x, y, w, h, { klick: true, art: "knoten", knoten: k });
}

// =============================================================================
// Datenfeld: Baum oben, Trainingstabelle unten
// =============================================================================
function zeichneDatenPanel() {
  P_DATEN.titel = SZ.titel;
  panel(P_DATEN);
  zeichneLegende();

  noStroke();
  fill(...FARBE.papier);
  stroke(...FARBE.linie);
  strokeWeight(1);
  rect(BAUM.x - 8, BAUM.y - 10, BAUM.w + 16, BAUM.h + 20, 10);
  zeichneBaum();

  if (!wurzel.analyse) {
    banner("Mit → wird die Wurzel untersucht: Welches Merkmal trennt am besten?", BAUM.x + BAUM.w / 2, BAUM.y + BAUM.h - 50, false);
  }

  zeichneTabelle();
}

function zeichneLegende() {
  textFont(SCHRIFT);
  textSize(12);
  const y = P_DATEN.y + 17;
  const eintraege = SZ.ziel.werte.map((w, k) => ({ name: `${SZ.ziel.name} ${w}`, k }));
  eintraege.push({ name: "Weg der Anfrage", k: -1 });
  let breite = 0;
  for (const e of eintraege) {
    breite += textWidth(e.name) + 34;
  }
  let x = P_DATEN.x + P_DATEN.w - 16 - breite;
  for (const e of eintraege) {
    noStroke();
    if (e.k >= 0) {
      fill(...SZ.ziel.farben[e.k]);
      rect(x, y - 6, 14, 12, 3);
    } else {
      stroke(...FARBE.senf);
      strokeWeight(4);
      line(x - 2, y, x + 14, y);
    }
    noStroke();
    fill(...FARBE.text);
    textAlign(LEFT, CENTER);
    text(e.name, x + 18, y + 1);
    x += textWidth(e.name) + 34;
  }
}

function zeichneTabelle() {
  const x0 = 44;
  const wGes = 780;
  const spNr = 64;
  const spZiel = 120;
  const nm = SZ.merkmale.length;
  const spM = (wGes - spNr - spZiel) / nm;
  const imFokus = new Set(fokus.zeilen);
  const hoverJ = hoverMerkmal();

  noStroke();
  fill(...FARBE.text);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(15);
  textAlign(LEFT, CENTER);
  text("Trainingsdaten", x0, T_Y);
  textStyle(NORMAL);
  fill(...FARBE.blass);
  textFont(SCHRIFT);
  textSize(12);
  textAlign(RIGHT, CENTER);
  text(`kräftig: die ${fokus.zeilen.length} ${SZ.wort.mehrzahl} im markierten Knoten (${knotenName(fokus)})`, x0 + wGes, T_Y);

  const zh = daten.length > 10 ? 20.5 : 24;
  let y = T_Y + 26;
  noStroke();
  fill(...FARBE.flaeche2);
  rect(x0, y - 12, wGes, 24, 6);
  if (hoverJ !== null) {
    fill(...FARBE.senf, 50);
    rect(x0 + spNr + hoverJ * spM, y - 12, spM, 24 + daten.length * zh + 2);
  }
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textStyle(BOLD);
  textSize(12);
  textAlign(CENTER, CENTER);
  text(SZ.wort.nr, x0 + spNr / 2, y);
  SZ.merkmale.forEach((m, j) => {
    const benutzt = fokus && istAufPfad(fokus, j);
    fill(...(benutzt ? FARBE.blass : FARBE.grau));
    text(m.name + (benutzt ? " ✓" : ""), x0 + spNr + j * spM + spM / 2, y);
  });
  fill(...FARBE.grau);
  text(SZ.ziel.name, x0 + spNr + nm * spM + spZiel / 2, y);
  textStyle(NORMAL);
  y += 12 + zh / 2;

  for (const z of daten) {
    const drin = imFokus.has(z);
    const a = drin ? 255 : 70;
    stroke(...FARBE.linie);
    strokeWeight(1);
    line(x0, y + zh / 2, x0 + wGes, y + zh / 2);
    noStroke();
    fill(...FARBE.text, a);
    textFont(MONO);
    textSize(12);
    textAlign(CENTER, CENTER);
    text(String(z.id), x0 + spNr / 2, y);
    textFont(SCHRIFT);
    for (let j = 0; j < nm; j++) {
      fill(...FARBE.text, a);
      text(SZ.merkmale[j].werte[z.m[j]], x0 + spNr + j * spM + spM / 2, y);
    }
    const f = SZ.ziel.farben[z.k];
    fill(f[0], f[1], f[2], drin ? 255 : 60);
    textStyle(BOLD);
    text(SZ.ziel.werte[z.k], x0 + spNr + nm * spM + spZiel / 2, y);
    textStyle(NORMAL);
    y += zh;
  }
}

// Wurde Merkmal j auf dem Weg zu Knoten k schon benutzt?
function istAufPfad(k, j) {
  let x = k.eltern;
  while (x) {
    if (x.split === j) {
      return true;
    }
    x = x.eltern;
  }
  return false;
}

function hoverMerkmal() {
  const z = zoneUnterMaus();
  return z && z.art === "ig" ? z.j : null;
}

// =============================================================================
// Erklärfeld
// =============================================================================
function erklaerung() {
  const k = fokus;
  const n = k.zeilen.length;
  if (!wurzel.analyse) {
    return {
      titel: "Entscheidungsbaum · Wurzel, Knoten, Äste, Blätter",
      text:
        `Der Baum soll aus den ${daten.length} ${SZ.wort.mehrzahl} Regeln lernen, die „${SZ.ziel.name}“ vorhersagen. ` +
        "An jedem Knoten wird das Merkmal gesucht, das die Klassen am saubersten trennt – gemessen mit dem Informationsgewinn IG.",
      formeln: [
        mass === "gini" ? "Gini-Unreinheit   Gini(S) = 1 − Σ P(c)²" : "Entropie   H(S) = − Σ P(c) · log₂ P(c)     (0 · log 0 := 0)",
        "Informationsgewinn",
        `IG(S, A) = ${massName()}(S) − Σ (Anzahlᵢ / Gesamtanzahl) · ${massName()}(Sᵢ)`,
        "Je größer IG, desto besser trennt das Merkmal A.",
      ],
    };
  }
  if (fertig && k === wurzel) {
    const acc = trainingsGenauigkeit();
    return {
      titel: "Baum fertig ✓",
      text:
        `Alle Blätter sind ${acc === 1 ? "rein" : "festgelegt"} – die Trainingsdaten werden zu ${prozent(acc, 0)} richtig eingeordnet. ` +
        "Unten rechts kann eine neue Anfrage durch den Baum geschickt werden. Vergleiche: Entropie ↔ Gini, oder begrenze die maximale Tiefe.",
      formeln: [`Wurzel: ${SZ.merkmale[wurzel.split].name}  (IG = ${f3(wurzel.analyse.bester.ig)})`, "Klick auf einen Knoten zeigt seine Rechnung."],
    };
  }
  if (!k.analyse) {
    return {
      titel: `Knoten „${knotenName(k)}“ · noch offen`,
      text: `${n} ${SZ.wort.mehrzahl} landen hier (${verteilungText(verteilung(k.zeilen, SZ.ziel.werte.length))}). Mit → wird er untersucht.`,
      formeln: [],
    };
  }
  const a = k.analyse;
  if (k.blatt) {
    return {
      titel: `Blatt „${knotenName(k)}“ → ${SZ.ziel.name} ${SZ.ziel.werte[k.klasse]}`,
      text: `${n} ${SZ.wort.mehrzahl} (${verteilungText(a.anzahl)}). Grund: ${k.grund}. Hier wird nicht weiter aufgeteilt.${fertig ? "" : " Weiter mit dem nächsten offenen Knoten."}`,
      formeln: [unreinheitFormel(a.anzahl)],
    };
  }
  const formeln = [unreinheitFormel(a.anzahl), igFormel(a.bester, n)];
  if (k.split !== null) {
    const g = a.gewinne.find((x) => x.j === k.split);
    return {
      titel: `Aufgeteilt nach „${SZ.merkmale[k.split].name}“`,
      text: `Für jeden Wert von ${SZ.merkmale[k.split].name} entsteht ein Ast: ${g.teilmengen.map((t) => `${SZ.merkmale[k.split].werte[t.wert]} (${verteilungText(t.anzahl)})`).join(", ")}. Die IGs müssen in jedem Ast neu berechnet werden, weil sich die Gesamtanzahl ändert.`,
      formeln: [unreinheitFormel(a.anzahl), igFormel(g, n)],
    };
  }
  return {
    titel: `Knoten „${knotenName(k)}“ · Welches Merkmal trennt am besten?`,
    text:
      `${n} ${SZ.wort.mehrzahl}: ${verteilungText(a.anzahl)}. Für jedes noch freie Merkmal wird der Informationsgewinn berechnet (Feld darunter). ` +
      (modus === "selbst" ? "Klicke das Merkmal an, nach dem geteilt werden soll." : `Den größten IG hat „${SZ.merkmale[a.bester.j].name}“${gleichstandText(a)} → mit → aufteilen.`),
    formeln,
  };
}

// Haben mehrere Merkmale denselben größten IG? Dann gewinnt das erste.
function gleichstandText(a) {
  const gleich = a.gewinne.filter((g) => g !== a.bester && Math.abs(g.ig - a.bester.ig) < 1e-9);
  if (gleich.length === 0) {
    return "";
  }
  return ` (Gleichstand mit „${gleich.map((g) => SZ.merkmale[g.j].name).join("“, „")}“ – dann wird das erste Merkmal genommen)`;
}

function zeichneErklaerung() {
  const e = erklaerung();
  P_ERKL.titel = e.titel;
  panel(P_ERKL);
  zeichneErklaerText(P_ERKL, e);
}

function zeichneEinstellungen() {
  const p = P_EINST;
  panel(p);
  noStroke();
  fill(...FARBE.blass);
  textFont(SCHRIFT);
  textSize(12);
  textAlign(LEFT, CENTER);
  text("Begrenzte Tiefe = weniger Überanpassung,", 1146, 420);
  text("aber unreine Blätter (Mehrheitsentscheid).", 1146, 436);
  textAlign(LEFT, TOP);
  const t =
    modus === "selbst"
      ? "Selbst wählen: Teile auch einmal nach einem schlechteren Merkmal – wie viel größer wird der Baum?"
      : szenario === "pruefung"
        ? "Laut Skript bevorzugt der IG Merkmale mit vielen Ausprägungen – die Farbe hat drei. Wird sie hier bevorzugt?"
        : "Tipp: Mit „selbst wählen“ entscheidest du an jedem Knoten, nach welchem Merkmal geteilt wird.";
  text(t, p.x + 16, p.y + p.h - 22);
}

// =============================================================================
// Informationsgewinn der Merkmale (anklickbar)
// =============================================================================
function zeichneIG() {
  const p = P_IG;
  const k = fokus;
  p.titel = `Informationsgewinn am Knoten „${kurzName(knotenName(k), 44)}“`;
  panel(p);
  if (!k.analyse) {
    leerText(p, "Mit → werden für den markierten Knoten\ndie Informationsgewinne aller freien Merkmale berechnet.");
    return;
  }
  const a = k.analyse;
  if (a.gewinne.length === 0 || (k.blatt && k.grund === "rein")) {
    leerText(p, `Der Knoten ist ${k.grund === "rein" ? "rein – alle gehören zur selben Klasse" : k.grund}.\nKein Aufteilen nötig.`);
    return;
  }
  const waehlbar = k === warteschlange[0] && wartetAufWahl();
  const n = k.zeilen.length;
  const zeilenH = Math.min(34, (p.h - KOPF_H - 16) / a.gewinne.length);
  let y = p.y + KOPF_H + 10;
  const lx = p.x + 16;
  const bx = p.x + 150;
  const bw = 220;
  const maxIG = Math.max(a.h, 1e-9);
  for (const g of a.gewinne) {
    const istBester = g === a.bester;
    const istGewaehlt = k.split === g.j;
    const hover = zoneUnterMaus();
    const istHover = hover && hover.art === "ig" && hover.j === g.j;
    if (istHover && waehlbar) {
      noStroke();
      fill(...FARBE.senf, 40);
      rect(p.x + 8, y - 2, p.w - 16, zeilenH - 2, 6);
    }
    noStroke();
    fill(...FARBE.text);
    textFont(SCHRIFT);
    textStyle(istBester || istGewaehlt ? BOLD : NORMAL);
    textSize(13);
    textAlign(LEFT, CENTER);
    text(SZ.merkmale[g.j].name, lx, y + 9);
    textStyle(NORMAL);
    fill(...FARBE.flaeche2);
    rect(bx, y + 3, bw, 13, 4);
    fill(...(istGewaehlt ? FARBE.text : istBester ? FARBE.gruen : FARBE.neutral));
    rect(bx, y + 3, (bw * Math.max(0, g.ig)) / maxIG, 13, 4);
    fill(...FARBE.text);
    textFont(MONO);
    textSize(12.5);
    textStyle(istBester ? BOLD : NORMAL);
    textAlign(LEFT, CENTER);
    text(`IG = ${f3(g.ig)}${istBester ? " ★" : ""}`, bx + bw + 10, y + 9);
    textStyle(NORMAL);
    // Aufteilung in Kurzform
    fill(...FARBE.blass);
    textFont(SCHRIFT);
    textSize(10.5);
    const det = g.teilmengen.map((t) => `${SZ.merkmale[g.j].werte[t.wert]} ${t.zeilen.length} (${t.anzahl.join("|")})`).join(" · ");
    text(det, bx + bw + 112, y + 9);
    zone(p.x + 8, y - 2, p.w - 16, zeilenH - 2, { klick: waehlbar, art: "ig", j: g.j, tip: igFormel(g, n) });
    y += zeilenH;
  }
}

function kurzName(s, n) {
  return s.length > n ? "…" + s.slice(s.length - n + 1) : s;
}

// =============================================================================
// Unreinheit des Knotens als Kurve (2 Klassen)
// =============================================================================
function zeichneUnreinheit() {
  const p = P_UNREIN;
  p.titel = mass === "gini" ? "Gini-Unreinheit am Knoten" : "Entropie am Knoten";
  panel(p);
  const gx = p.x + 42;
  const gy = p.y + KOPF_H + 14;
  const gw = 150;
  const gh = 100;
  const maxH = mass === "gini" ? 0.5 : 1;
  const sx = (v) => gx + v * gw;
  const sy = (v) => gy + gh - (v / maxH) * gh;

  stroke(...FARBE.linie);
  strokeWeight(1);
  noFill();
  rect(gx, gy, gw, gh);
  stroke(...FARBE.gruen);
  strokeWeight(2.2);
  beginShape();
  for (let i = 0; i <= 60; i++) {
    const q = i / 60;
    vertex(sx(q), sy(unreinheit([q, 1 - q], mass)));
  }
  endShape();

  noStroke();
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textSize(10);
  textAlign(CENTER, TOP);
  text("0", sx(0), gy + gh + 3);
  text("1", sx(1), gy + gh + 3);
  text(`Anteil „${SZ.ziel.werte[0]}“`, gx + gw / 2, gy + gh + 3);
  textAlign(RIGHT, CENTER);
  text(fKomma(maxH, 1), gx - 4, sy(maxH));
  text("0", gx - 4, sy(0));

  const anzahl = verteilung(fokus.zeilen, SZ.ziel.werte.length);
  const n = fokus.zeilen.length;
  if (n > 0) {
    const q = anzahl[0] / n;
    const h = unreinheit(anzahl, mass);
    stroke(...FARBE.flaeche);
    strokeWeight(1.5);
    fill(...FARBE.senf);
    circle(sx(q), sy(h), 12);
  }
  const tx = gx + gw + 16;
  noStroke();
  fill(...FARBE.blass);
  textFont(SCHRIFT);
  textSize(11.5);
  textAlign(LEFT, TOP);
  text("markierter Knoten", tx, gy);
  fill(...FARBE.text);
  textFont(MONO);
  textStyle(BOLD);
  textSize(18);
  text(`${massName()} = ${f3(unreinheit(anzahl, mass))}`, tx, gy + 18);
  textStyle(NORMAL);
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textSize(11.5);
  text(n > 0 ? verteilungText(anzahl) : "leer", tx, gy + 46);
  fill(...FARBE.blass);
  textSize(10.5);
  text(`0 = rein (alle gleich)\n${fKomma(maxH, 1)} = maximal gemischt`, tx, gy + 70);
  textAlign(LEFT, CENTER);
  textSize(10.5);
  text(mass === "gini" ? "Gini(S) = 1 − Σ P(c)²" : "H(S) = − Σ P(c) · log₂ P(c)", p.x + 16, p.y + p.h - 14);
}

// =============================================================================
// Neue Anfrage durch den Baum schicken
// =============================================================================
function zeichneAnfrage() {
  const p = P_ANFRAGE;
  panel(p);
  let y = p.y + KOPF_H + 18;
  SZ.merkmale.forEach((m, j) => {
    noStroke();
    fill(...FARBE.grau);
    textFont(SCHRIFT);
    textSize(12.5);
    textAlign(LEFT, CENTER);
    text(m.name, p.x + 16, y);
    const s = m.werte[anfrageWerte[j]];
    const bx = p.x + 130;
    const bw = 120;
    const hover = mausX() >= bx && mausX() <= bx + bw && mausY() >= y - 11 && mausY() <= y + 11;
    stroke(...(hover ? FARBE.senf : FARBE.linie));
    strokeWeight(hover ? 2 : 1.2);
    fill(...FARBE.flaeche);
    rect(bx, y - 11, bw, 22, 11);
    noStroke();
    fill(...FARBE.text);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(s + "  ⟳", bx + bw / 2, y);
    textStyle(NORMAL);
    zone(bx, y - 11, bw, 22, { klick: true, art: "anfrage", j, tip: "Klick: nächster Wert" });
    y += 27;
  });
  const weg = pfad(wurzel, anfrageWerte);
  const ende = weg[weg.length - 1];
  y = p.y + p.h - 20;
  noStroke();
  textFont(SCHRIFT);
  textStyle(BOLD);
  textSize(13);
  textAlign(LEFT, CENTER);
  if (ende.blatt) {
    fill(...SZ.ziel.farben[ende.klasse]);
    text(`→ ${SZ.ziel.name} ${SZ.ziel.werte[ende.klasse]}  (über ${weg.length - 1} Entscheidung${weg.length === 2 ? "" : "en"})`, p.x + 16, y);
  } else {
    fill(...FARBE.blass);
    textStyle(NORMAL);
    text("→ Der Baum ist an dieser Stelle noch nicht fertig.", p.x + 16, y);
  }
  textStyle(NORMAL);
}

// -----------------------------------------------------------------------------
// Tooltip
// -----------------------------------------------------------------------------
function zeichneTooltip() {
  const z = zoneUnterMaus();
  if (!z) {
    return;
  }
  if (z.art === "knoten") {
    const k = z.knoten;
    const zeilen = [`${knotenName(k)} · ${k.zeilen.length} ${SZ.wort.mehrzahl}: ${verteilungText(verteilung(k.zeilen, SZ.ziel.werte.length))}`];
    if (k.analyse) {
      zeilen.push(unreinheitFormel(k.analyse.anzahl));
    }
    if (k.blatt) {
      zeilen.push(`Blatt (${k.grund})`);
    }
    zeilen.push("Klick: diesen Knoten ansehen");
    tooltip(zeilen);
  } else if (z.tip) {
    tooltip(z.art === "ig" && z.klick ? [z.tip, "Klick: nach diesem Merkmal aufteilen"] : z.tip);
  }
}

// =============================================================================
// Eingaben
// =============================================================================
function mousePressed() {
  const z = zoneUnterMaus();
  if (!z || !z.klick) {
    return;
  }
  if (z.art === "knoten") {
    fokus = z.knoten;
  } else if (z.art === "ig" && !laufAuto) {
    const k = warteschlange[0];
    if (wartetAufWahl()) {
      aufteilen(k, z.j);
      if (k.analyse.bester.j !== z.j) {
        zeigeHinweis(`Aufgeteilt nach „${SZ.merkmale[z.j].name}“ – nicht das Merkmal mit dem größten IG. Mal sehen, wie groß der Baum wird …`);
      }
    }
  } else if (z.art === "anfrage") {
    anfrageWerte[z.j] = (anfrageWerte[z.j] + 1) % SZ.merkmale[z.j].werte.length;
  }
}

function keyPressed() {
  if (!tastaturFrei()) {
    return true;
  }
  if (key === "ArrowRight") {
    if (!laufAuto) {
      schritt();
    }
    return false;
  }
  if (key === " ") {
    autoUmschalten();
    return false;
  }
  if ((key === "r" || key === "R") && !laufAuto) {
    neuStarten();
    return false;
  }
  return true;
}

// =============================================================================
// Daten als CSV speichern (z. B. für Orange: Tree-Widget)
// =============================================================================
function csvSpeichern() {
  const kopf = ["nr"].concat(SZ.merkmale.map((m) => m.name.toLowerCase().replace(/[^a-zäöüß]/g, "")), [SZ.ziel.name.toLowerCase().replace(/[^a-zäöüß]/g, "")]);
  const zeilen = [kopf.join(";")];
  for (const z of daten) {
    zeilen.push([z.id].concat(z.m.map((v, j) => SZ.merkmale[j].werte[v]), [SZ.ziel.werte[z.k]]).join(";"));
  }
  ladeHerunter(SZ.csvDatei, zeilen.join("\n") + "\n");
}
