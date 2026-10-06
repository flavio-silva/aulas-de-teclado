/* Acordes do curso e verificação de acordes montados no teclado (requer keyboard.js).
 *
 *   Chords.notes("F")            // ["Fá", "Lá", "Dó"]
 *   Chords.check([53,57,60], "F") // { ok: true } ou { ok: false, msg: "..." }
 */
(function () {
  // Tríades fechadas, fundamental embaixo: semitons acima da fundamental
  const CHORDS = {
    C: { root: 0, steps: [0, 4, 7] },
    F: { root: 5, steps: [0, 4, 7] },
    G: { root: 7, steps: [0, 4, 7] },
  };
  const name = (m) => PianoKeyboard.info(m).name;
  const notes = (chord) => CHORDS[chord].steps.map((s) => PianoKeyboard.SOLFEGE[(CHORDS[chord].root + s) % 12]);

  function check(sel, chord) {
    const c = CHORDS[chord];
    const want = notes(chord);
    const got = sel.map(name).join(", ") || "nada";
    if (sel.length !== 3) return { ok: false, msg: `Você marcou ${sel.length} tecla(s): ${got}. O acorde precisa de exatamente 3.` };
    const [a, b, d] = sel;
    if (a % 12 === c.root && b === a + c.steps[1] && d === a + c.steps[2]) return { ok: true };
    const pcs = c.steps.map((s) => (c.root + s) % 12);
    if (sel.every((m) => pcs.includes(m % 12)))
      return { ok: false, msg: `As notas são as do ${chord} (${got}), mas fora de ordem ou espalhadas. Comece no ${want[0]} e vá pulando uma: ${want.join(", ")}.` };
    return { ok: false, msg: `Você marcou ${got}. O ${chord} é ${want.join(" + ")}: comece no ${want[0]} e vá pulando uma branca.` };
  }

  window.Chords = { CHORDS, notes, check };
})();
