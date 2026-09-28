/* Quiz de múltipla escolha com feedback imediato (reutilizável).
 *
 *   Quiz.create(elemento, [
 *     { prompt: "Texto ou HTML", options: ["A","B","C"], answer: "B",
 *       explain: "Por que B.", setup: (areaExtra) => {} },   // setup opcional (ex.: destacar tecla)
 *   ], { shuffle: true, onDone: (acertos, total) => {} });
 */
(function () {
  const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((p) => p[1]);

  function create(root, questions, opts = {}) {
    let qs, i, score, firstTry;

    function start() {
      qs = opts.shuffle === false ? questions.slice() : shuffle(questions);
      i = 0; score = 0;
      show();
    }

    function show() {
      if (i >= qs.length) return finish();
      const q = qs[i];
      firstTry = true;
      root.innerHTML = `
        <div class="qz-progress small">Pergunta ${i + 1} de ${qs.length}</div>
        <div class="qz-prompt">${q.prompt}</div>
        <div class="qz-extra"></div>
        <div class="qz-options row"></div>
        <p class="status" aria-live="polite"></p>`;
      q.setup && q.setup(root.querySelector(".qz-extra"));
      const box = root.querySelector(".qz-options");
      const status = root.querySelector(".status");
      shuffle(q.options).forEach((opt) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "qz-opt";
        b.textContent = opt;
        b.onclick = () => {
          if (opt === q.answer) {
            if (firstTry) score++;
            b.classList.add("qz-ok");
            status.className = "status ok";
            status.innerHTML = "Isso! " + (q.explain || "");
            box.querySelectorAll("button").forEach((x) => (x.disabled = true));
            const next = document.createElement("button");
            next.className = "primary";
            next.textContent = i + 1 < qs.length ? "Próxima →" : "Ver resultado";
            next.onclick = () => { i++; show(); };
            status.after(next);
            next.focus();
          } else {
            firstTry = false;
            b.classList.add("qz-bad");
            b.disabled = true;
            status.className = "status bad";
            status.textContent = "Ainda não. Tente de novo.";
          }
        };
        box.appendChild(b);
      });
    }

    function finish() {
      root.innerHTML = `
        <p><strong>${score} de ${qs.length}</strong> de primeira.
        ${score === qs.length ? "Perfeito! 🎉" : "Refaça daqui a um ou dois dias: é o esforço de lembrar que fixa."}</p>`;
      const again = document.createElement("button");
      again.textContent = "Refazer (ordem nova)";
      again.onclick = start;
      root.appendChild(again);
      opts.onDone && opts.onDone(score, qs.length);
    }

    start();
  }

  const css = `
  .qz-prompt { margin: .3rem 0 .6rem; font-size: 1.05rem; }
  .qz-opt { min-width: 4.5rem; font-size: 1rem; }
  .qz-opt.qz-ok { background: var(--ok-soft); border-color: var(--ok); color: var(--ok); }
  .qz-opt.qz-bad { background: var(--bad-soft); border-color: var(--bad); color: var(--bad); }
  .qz-progress { font-family: var(--sans); }
  `;
  const s = document.createElement("style");
  s.textContent = css;
  document.head.appendChild(s);

  window.Quiz = { create };
})();
