// =============================================================================
//  daten.js – Trainingsdaten der Beispiele (kategoriale Merkmale MIT Klasse)
// =============================================================================
//  Ein Entscheidungsbaum teilt die Daten Schritt für Schritt nach dem Merkmal
//  auf, das die Klassen am besten trennt (größter Informationsgewinn).
//
//  Beispiel "skript" (Standard):
//    Skript 5.3: Kreditvergabe einer Bank mit 10 Kunden.
//
//  Beispiel "pruefung":
//    Prüfstation der Modellanlage: Farbe, Höhe, Bohrung und Oberfläche eines
//    Werkstücks → Gutteil oder Ausschuss? Silberne Teile sind Sichtteile –
//    dort ist schon ein Kratzer zu viel.
//
//  Beispiel "wartung":
//    Instandhaltung: Betriebsstunden, Vibration, Temperatur und Ölstand
//    einer Pumpe → Ist eine Wartung fällig?
//
//  Jede Zeile: Werte der Merkmale in der Reihenfolge von "merkmale", zuletzt
//  die Klasse.
// =============================================================================

const SZENARIEN = {
  skript: {
    name: "Skript · Kreditvergabe",
    titel: "Trainingsdaten · Kreditvergabe",
    untertitel: "Beispiel aus dem Skript (5.3) · Entscheidungsbaum (ID3) · Klassifikation",
    merkmale: [
      { name: "Alter", werte: ["jung", "alt"] },
      { name: "Einkommen", werte: ["niedrig", "hoch"] },
      { name: "Kredithistorie", werte: ["schlecht", "gut"] },
      { name: "Sicherheit", werte: ["nein", "ja"] },
    ],
    ziel: { name: "Kredit?", werte: ["ja", "nein"], farben: [[52, 128, 84], [200, 30, 58]] },
    zeilen: [
      ["jung", "niedrig", "schlecht", "nein", "nein"],
      ["jung", "niedrig", "schlecht", "ja", "nein"],
      ["jung", "hoch", "schlecht", "nein", "ja"],
      ["jung", "hoch", "gut", "nein", "ja"],
      ["jung", "hoch", "gut", "ja", "ja"],
      ["alt", "niedrig", "schlecht", "nein", "nein"],
      ["alt", "niedrig", "schlecht", "ja", "nein"],
      ["alt", "niedrig", "gut", "nein", "ja"],
      ["alt", "hoch", "schlecht", "nein", "ja"],
      ["alt", "hoch", "gut", "nein", "ja"],
    ],
    anfrage: ["jung", "niedrig", "gut", "nein"],
    wort: { einzahl: "Kunde", mehrzahl: "Kunden", nr: "Kd-Nr." },
    csvDatei: "kreditvergabe_skript.csv",
  },

  pruefung: {
    name: "Prüfstation · Ausschuss",
    titel: "Prüfprotokoll · Prüfstation",
    untertitel: "Qualitätsprüfung · Entscheidungsbaum (ID3) · Gutteil oder Ausschuss?",
    merkmale: [
      { name: "Farbe", werte: ["rot", "schwarz", "silber"] },
      { name: "Höhe", werte: ["ok", "zu niedrig"] },
      { name: "Bohrung", werte: ["ok", "fehlt"] },
      { name: "Oberfläche", werte: ["glatt", "Kratzer"] },
    ],
    ziel: { name: "Ergebnis", werte: ["Gutteil", "Ausschuss"], farben: [[52, 128, 84], [200, 30, 58]] },
    zeilen: [
      ["rot", "ok", "ok", "glatt", "Gutteil"],
      ["schwarz", "ok", "ok", "Kratzer", "Gutteil"],
      ["silber", "ok", "ok", "glatt", "Gutteil"],
      ["silber", "ok", "ok", "Kratzer", "Ausschuss"],
      ["rot", "zu niedrig", "ok", "glatt", "Ausschuss"],
      ["schwarz", "ok", "fehlt", "glatt", "Ausschuss"],
      ["silber", "ok", "fehlt", "glatt", "Ausschuss"],
      ["rot", "ok", "ok", "Kratzer", "Gutteil"],
      ["schwarz", "ok", "ok", "glatt", "Gutteil"],
      ["silber", "zu niedrig", "ok", "glatt", "Ausschuss"],
      ["rot", "ok", "fehlt", "Kratzer", "Ausschuss"],
      ["schwarz", "zu niedrig", "ok", "Kratzer", "Ausschuss"],
      ["silber", "ok", "ok", "glatt", "Gutteil"],
      ["rot", "ok", "ok", "glatt", "Gutteil"],
    ],
    anfrage: ["silber", "ok", "ok", "Kratzer"],
    wort: { einzahl: "Werkstück", mehrzahl: "Werkstücke", nr: "Nr." },
    csvDatei: "pruefprotokoll_pruefstation.csv",
  },

  wartung: {
    name: "Pumpe · Wartung fällig?",
    titel: "Zustandsdaten · Kühlmittelpumpen",
    untertitel: "Instandhaltung · Entscheidungsbaum (ID3) · Wartung planen",
    merkmale: [
      { name: "Betriebsstd.", werte: ["niedrig", "mittel", "hoch"] },
      { name: "Vibration", werte: ["normal", "erhöht"] },
      { name: "Temperatur", werte: ["normal", "hoch"] },
      { name: "Ölstand", werte: ["ok", "niedrig"] },
    ],
    ziel: { name: "Wartung?", werte: ["nein", "ja"], farben: [[52, 128, 84], [200, 30, 58]] },
    zeilen: [
      ["niedrig", "normal", "normal", "ok", "nein"],
      ["niedrig", "erhöht", "normal", "ok", "nein"],
      ["mittel", "normal", "normal", "ok", "nein"],
      ["mittel", "erhöht", "normal", "ok", "ja"],
      ["hoch", "normal", "normal", "ok", "nein"],
      ["hoch", "normal", "hoch", "ok", "ja"],
      ["hoch", "erhöht", "normal", "ok", "ja"],
      ["niedrig", "normal", "hoch", "niedrig", "ja"],
      ["mittel", "normal", "hoch", "ok", "nein"],
      ["mittel", "erhöht", "hoch", "ok", "ja"],
      ["hoch", "normal", "normal", "niedrig", "ja"],
      ["niedrig", "normal", "hoch", "ok", "nein"],
      ["mittel", "normal", "normal", "niedrig", "ja"],
      ["niedrig", "erhöht", "hoch", "ok", "nein"],
    ],
    anfrage: ["mittel", "erhöht", "normal", "ok"],
    wort: { einzahl: "Pumpe", mehrzahl: "Pumpen", nr: "Nr." },
    csvDatei: "zustandsdaten_pumpen.csv",
  },
};

// aktives Beispiel – wird mit setzeSzenario() umgeschaltet
let SZ = SZENARIEN.skript;

function setzeSzenario(schluessel) {
  SZ = SZENARIEN[schluessel];
}

// Zeilen in Zahlen umwandeln: m[j] = Index des Wertes, k = Index der Klasse
function erzeugeDaten() {
  return SZ.zeilen.map((z, i) => {
    const m = SZ.merkmale.map((mm, j) => {
      const idx = mm.werte.indexOf(z[j]);
      if (idx < 0) {
        throw new Error(`Unbekannter Wert „${z[j]}“ bei ${mm.name} (Zeile ${i + 1})`);
      }
      return idx;
    });
    const k = SZ.ziel.werte.indexOf(z[z.length - 1]);
    if (k < 0) {
      throw new Error(`Unbekannte Klasse „${z[z.length - 1]}“ (Zeile ${i + 1})`);
    }
    return { id: i + 1, m, k };
  });
}
