// =============================================================================
//  baum.js – der Algorithmus (ID3, Skript 5.3)
// =============================================================================
//  Unreinheit einer Menge S mit den Klassenanteilen P(c):
//    Entropie   H(S)    = − Σ P(c) · log₂ P(c)        (0 · log 0 := 0)
//    Gini       Gini(S) = 1 − Σ P(c)²
//
//  Informationsgewinn eines Merkmals A:
//    IG(S, A) = H(S) − Σ (Anzahlᵢ / Gesamtanzahl) · H(Sᵢ)
//
//  Ablauf
//    1. Unreinheit des Knotens berechnen
//    2. IG für jedes noch nicht benutzte Merkmal berechnen
//    3. nach dem Merkmal mit dem größten IG aufteilen (IG = 0 → nicht teilen)
//    4. für jeden neuen Ast wieder bei 1 beginnen, bis alle Blätter rein sind
// =============================================================================

function verteilung(zeilen, anzahlKlassen) {
  const n = new Array(anzahlKlassen).fill(0);
  for (const z of zeilen) {
    n[z.k]++;
  }
  return n;
}

function log2(x) {
  return Math.log(x) / Math.LN2;
}

function unreinheit(anzahl, mass) {
  const gesamt = anzahl.reduce((a, b) => a + b, 0);
  if (gesamt === 0) {
    return 0;
  }
  if (mass === "gini") {
    let s = 0;
    for (const a of anzahl) {
      s += (a / gesamt) * (a / gesamt);
    }
    return 1 - s;
  }
  let h = 0;
  for (const a of anzahl) {
    if (a > 0) {
      const p = a / gesamt;
      h -= p * log2(p);
    }
  }
  return h;
}

// Zeilen nach den Werten von Merkmal j aufteilen
function teile(zeilen, j, anzahlWerte) {
  const t = [];
  for (let w = 0; w < anzahlWerte; w++) {
    t.push([]);
  }
  for (const z of zeilen) {
    t[z.m[j]].push(z);
  }
  return t;
}

function infoGewinn(zeilen, j, mass) {
  const nk = SZ.ziel.werte.length;
  const h = unreinheit(verteilung(zeilen, nk), mass);
  const teilmengen = teile(zeilen, j, SZ.merkmale[j].werte.length).map((tz, w) => {
    const anzahl = verteilung(tz, nk);
    return { wert: w, zeilen: tz, anzahl, h: unreinheit(anzahl, mass) };
  });
  let rest = 0;
  for (const t of teilmengen) {
    rest += (t.zeilen.length / zeilen.length) * t.h;
  }
  return { j, h, teilmengen, ig: h - rest };
}

// -----------------------------------------------------------------------------
// Knoten
// -----------------------------------------------------------------------------
let knotenZaehler = 0;

function neuerKnoten(zeilen, tiefe, frei, eltern, wert) {
  knotenZaehler++;
  return {
    id: knotenZaehler,
    zeilen,
    tiefe,
    frei, // noch nicht benutzte Merkmale
    eltern,
    wert, // Wert des Elternmerkmals, der hierher führt
    analyse: null, // Ergebnis der IG-Berechnung
    split: null, // Merkmal, nach dem geteilt wurde
    kinder: [],
    blatt: false,
    klasse: null,
    grund: "", // warum Blatt
  };
}

function mehrheit(zeilen, ersatz) {
  if (zeilen.length === 0) {
    return ersatz;
  }
  const n = verteilung(zeilen, SZ.ziel.werte.length);
  let best = 0;
  for (let k = 1; k < n.length; k++) {
    if (n[k] > n[best]) {
      best = k;
    }
  }
  return best;
}

// Schritt 1 + 2: Unreinheit und alle Informationsgewinne
function analysiere(knoten, mass, maxTiefe) {
  const nk = SZ.ziel.werte.length;
  const anzahl = verteilung(knoten.zeilen, nk);
  const h = unreinheit(anzahl, mass);
  const gewinne = knoten.frei.map((j) => infoGewinn(knoten.zeilen, j, mass));
  let bester = null;
  for (const g of gewinne) {
    if (!bester || g.ig > bester.ig + 1e-12) {
      bester = g;
    }
  }
  knoten.analyse = { anzahl, h, gewinne, bester };

  // Ist der Knoten schon fertig?
  const ersatz = knoten.eltern ? mehrheit(knoten.eltern.zeilen, 0) : 0;
  if (knoten.zeilen.length === 0) {
    macheBlatt(knoten, ersatz, "leer – Mehrheit des Elternknotens");
  } else if (h < 1e-12) {
    macheBlatt(knoten, mehrheit(knoten.zeilen, ersatz), "rein");
  } else if (knoten.frei.length === 0) {
    macheBlatt(knoten, mehrheit(knoten.zeilen, ersatz), "keine Merkmale mehr – Mehrheit");
  } else if (maxTiefe > 0 && knoten.tiefe >= maxTiefe) {
    macheBlatt(knoten, mehrheit(knoten.zeilen, ersatz), `maximale Tiefe ${maxTiefe} – Mehrheit`);
  } else if (bester.ig < 1e-9) {
    macheBlatt(knoten, mehrheit(knoten.zeilen, ersatz), "IG = 0 bei allen Merkmalen – Mehrheit");
  }
  return knoten.analyse;
}

function macheBlatt(knoten, klasse, grund) {
  knoten.blatt = true;
  knoten.klasse = klasse;
  knoten.grund = grund;
}

// Schritt 3: nach Merkmal j aufteilen → neue Kindknoten
function splitte(knoten, j) {
  knoten.split = j;
  const frei = knoten.frei.filter((x) => x !== j);
  const t = teile(knoten.zeilen, j, SZ.merkmale[j].werte.length);
  knoten.kinder = t.map((zeilen, w) => neuerKnoten(zeilen, knoten.tiefe + 1, frei, knoten, w));
  return knoten.kinder;
}

// Eine Anfrage durch den Baum schicken: liefert den Pfad (Liste von Knoten)
function pfad(wurzel, m) {
  const p = [wurzel];
  let k = wurzel;
  while (k.split !== null && k.kinder.length > 0) {
    k = k.kinder[m[k.split]];
    p.push(k);
  }
  return p;
}
