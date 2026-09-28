/* Teclado virtual reutilizável (com som).
 *
 *   const kb = PianoKeyboard.create(elemento, {
 *     start: 48,            // nota MIDI da primeira tecla (48 = Dó; 60 = Dó central)
 *     octaves: 2,           // quantas oitavas desenhar
 *     labels: "none",       // "none" | "solfege" (Dó Ré...) | "letters" (C D...) | "both"
 *     mode: "play",         // "play" | "select" (cada toque marca/desmarca a tecla, para montar acordes)
 *     onPress: (info) => {} // info = { midi, name, letter, isBlack }
 *   });
 *   kb.mark(midi, "ok" | "bad" | "hint" | "on");  kb.clear();  kb.play(midi);  kb.chord([60,64,67]);
 *   kb.selected()  // modo "select": [midi, ...] das teclas marcadas
 */
(function () {
  const SOLFEGE = ["Dó", "Dó♯", "Ré", "Ré♯", "Mi", "Fá", "Fá♯", "Sol", "Sol♯", "Lá", "Lá♯", "Si"];
  const LETTERS = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  const BLACK = new Set([1, 3, 6, 8, 10]);

  let ctx = null;
  function audio() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // Som de "piano elétrico" simples: algumas harmônicas com decaimento.
  function play(midi, when = 0, dur = 1.6) {
    const ac = audio();
    const t = ac.currentTime + when;
    const f = 440 * Math.pow(2, (midi - 69) / 12);
    const out = ac.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    out.connect(ac.destination);
    [[1, 1], [2, 0.35], [3, 0.12], [4, 0.06]].forEach(([mult, amp]) => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = "sine";
      o.frequency.value = f * mult;
      g.gain.value = amp;
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + dur);
    });
  }

  function info(midi) {
    const pc = midi % 12;
    return { midi, name: SOLFEGE[pc], letter: LETTERS[pc], isBlack: BLACK.has(pc), pc };
  }

  function create(root, opts = {}) {
    const start = opts.start ?? 48;
    const octaves = opts.octaves ?? 2;
    const labels = opts.labels ?? "none";
    const end = start + octaves * 12; // inclui o Dó final
    root.classList.add("pk");
    root.innerHTML = "";
    const keys = new Map();

    const whites = [];
    for (let m = start; m <= end; m++) if (!BLACK.has(m % 12)) whites.push(m);
    const w = 100 / whites.length;

    let wi = 0;
    for (let m = start; m <= end; m++) {
      const i = info(m);
      const el = document.createElement("button");
      el.type = "button";
      el.className = "pk-key " + (i.isBlack ? "pk-black" : "pk-white");
      el.setAttribute("aria-label", `${i.name} (${i.letter})`);
      if (i.isBlack) {
        el.style.left = `calc(${wi * w}% - ${w * 0.3}%)`;
        el.style.width = `${w * 0.6}%`;
      } else {
        el.style.left = `${wi * w}%`;
        el.style.width = `${w}%`;
        wi++;
        const lab = document.createElement("span");
        lab.className = "pk-label";
        lab.textContent = labels === "solfege" ? i.name : labels === "letters" ? i.letter : labels === "both" ? `${i.name}\n${i.letter}` : "";
        el.appendChild(lab);
      }
      el.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        play(m);
        if (opts.mode === "select") el.classList.toggle("pk-on");
        el.classList.add("pk-down");
        setTimeout(() => el.classList.remove("pk-down"), 160);
        opts.onPress && opts.onPress(i);
      });
      keys.set(m, el);
      root.appendChild(el);
    }

    return {
      keys,
      play,
      chord(notes, arpeggio = 0) { notes.forEach((n, k) => play(n, k * arpeggio, 2.2)); },
      mark(midi, cls) { keys.get(midi)?.classList.add("pk-" + cls); },
      unmark(midi, cls) { keys.get(midi)?.classList.remove("pk-" + cls); },
      clear() { keys.forEach((el) => el.classList.remove("pk-ok", "pk-bad", "pk-hint", "pk-on")); },
      // modo "select": teclas marcadas (pk-on), da mais grave para a mais aguda
      selected() { return [...keys].filter(([, el]) => el.classList.contains("pk-on")).map(([m]) => m); },
      setLabel(midi, text) { const l = keys.get(midi)?.querySelector(".pk-label"); if (l) l.textContent = text; },
      whites,
    };
  }

  // Estilos do componente (injetados uma vez).
  const css = `
  .pk { position: relative; height: 170px; margin: 1rem 0; user-select: none; -webkit-user-select: none; touch-action: manipulation; }
  .pk-key { position: absolute; top: 0; padding: 0; border-radius: 0 0 6px 6px; cursor: pointer; font-family: var(--sans, sans-serif); }
  .pk-white { height: 100%; background: #fff; border: 1px solid #bbb; z-index: 1; display: flex; align-items: flex-end; justify-content: center; }
  .pk-black { height: 60%; background: #1d1d1d; border: 1px solid #000; z-index: 2; }
  .pk-label { white-space: pre; font-size: 11px; line-height: 1.2; color: #555; padding-bottom: 8px; text-align: center; pointer-events: none; }
  .pk-white.pk-down { background: #eee; } .pk-black.pk-down { background: #444; }
  .pk-white.pk-ok { background: #cfeedd; } .pk-black.pk-ok { background: #2f7d4f; }
  .pk-white.pk-bad { background: #f6cfcb; } .pk-black.pk-bad { background: #b3261e; }
  .pk-white.pk-hint { background: #ffeeb3; box-shadow: inset 0 -6px 0 #e0a100; } .pk-black.pk-hint { background: #7a5a00; }
  .pk-white.pk-on { background: #fbdccf; box-shadow: inset 0 -6px 0 #9a3b1b; } .pk-black.pk-on { background: #9a3b1b; }
  .pk-key:focus-visible { outline: 3px solid #e0a100; outline-offset: -3px; }
  @media (max-width: 520px) { .pk { height: 130px; } .pk-label { font-size: 9px; } }
  @media print { .pk-key { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  `;
  const s = document.createElement("style");
  s.textContent = css;
  document.head.appendChild(s);

  window.PianoKeyboard = { create, play, info, SOLFEGE, LETTERS };
})();
