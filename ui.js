// =============================================================================
//  ui.js – HTML-Bedienelemente über der Zeichenfläche
// =============================================================================
//  Positionen im logischen 1600×900-Raster (Helfer in basis.js).
//  Baumknoten, IG-Balken und die Anfrage werden direkt auf der Zeichenfläche
//  angeklickt (Klickzonen in sketch.js).
// =============================================================================

function erstelleUi() {
  erstelleHuelle();
  erstelleBeispielReiter(szenarioWechseln);

  ui.komplett = knopf(1250, 12, 170, "Baum sofort bauen", baumKomplett, "kopf");
  ui.csv = knopf(1428, 12, 148, "CSV speichern", csvSpeichern, "kopf");

  // --- Ablauf (Erklärfeld) ---------------------------------------------------
  ui.schritt = knopf(876, 284, 190, "Schritt ▶ (→)", schritt, "dunkel");
  ui.auto = knopf(1074, 284, 190, "▶ Automatisch", autoUmschalten, "primaer");
  ui.neu = knopf(1272, 284, 190, "↺ Neu starten (R)", neuStarten);

  // --- Einstellungen ---------------------------------------------------------
  platziere(createSpan("Maß"), 876, 380, 44);
  ui.mass = auswahl(
    920,
    380,
    150,
    [
      ["Entropie", "entropie"],
      ["Gini-Unreinheit", "gini"],
    ],
    mass,
    (v) => {
      mass = v;
      neuStarten();
    }
  );

  platziere(createSpan("Split"), 1088, 380, 44);
  ui.modus = auswahl(
    1132,
    380,
    270,
    [
      ["automatisch: größter IG", "auto"],
      ["selbst wählen (Klick auf Merkmal)", "selbst"],
    ],
    modus,
    (v) => {
      modus = v;
    }
  );

  platziere(createSpan("Tempo"), 1418, 380, 56);
  ui.tempo = auswahl(
    1474,
    380,
    90,
    ["langsam", "mittel", "schnell"].map((v) => [v, v]),
    tempo,
    (v) => {
      tempo = v;
    }
  );

  platziere(createSpan("Maximale Tiefe"), 876, 418, 120);
  ui.tiefe = auswahl(
    996,
    418,
    130,
    [
      ["unbegrenzt", "0"],
      ["1 Ebene", "1"],
      ["2 Ebenen", "2"],
      ["3 Ebenen", "3"],
    ],
    maxTiefe,
    (v) => {
      maxTiefe = Number(v);
      neuStarten();
    }
  );
}

// wird in jedem Frame aufgerufen
function aktualisiereUi() {
  beschrifte(ui.auto, laufAuto ? "■ Anhalten" : "▶ Automatisch");
  klasse(ui.auto, "primaer", !laufAuto);
  klasse(ui.auto, "dunkel", laufAuto);

  let t;
  if (fertig) {
    t = "Fertig ✓";
  } else if (wartetAufWahl()) {
    t = modus === "selbst" ? "Merkmal anklicken ✋" : "③ Aufteilen ▶ (→)";
  } else {
    t = "① Knoten prüfen ▶ (→)";
  }
  beschrifte(ui.schritt, t);
  sperre(ui.schritt, laufAuto || fertig || (wartetAufWahl() && modus === "selbst"));
  sperre(ui.auto, fertig);
  sperre(ui.komplett, laufAuto || fertig);

  for (const [el, wert] of [
    [ui.mass, mass],
    [ui.modus, modus],
    [ui.tiefe, String(maxTiefe)],
  ]) {
    if (el.value() !== wert) {
      el.selected(wert);
    }
  }
  aktualisiereBeispielReiter(szenario, laufAuto);
  for (const el of [ui.mass, ui.tiefe, ui.neu]) {
    sperre(el, laufAuto);
  }
}
