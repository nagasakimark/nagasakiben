(function () {
  "use strict";

  const ENTRIES = window.ENTRIES;
  const SOURCES = window.SOURCES;

  // ── storage (may be unavailable) ──
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  // ── UI text ──
  const T = {
    en: {
      brandSub: "Nagasaki-ben Dictionary", tabHome: "Home", tabBrowse: "Browse", tabQuiz: "Quiz", tabAbout: "About",
      heroTitle: "Learn Nagasaki-ben", heroLead: "{n} words, phrases and grammar points, with real example sentences.",
      search: "Search: English, かな, kanji or romaji", today: "Word of the day", seeEntry: "Open entry",
      bySound: "Browse by sound", byKind: "Browse by type", all: "All",
      kinds: { word: "Words", phrase: "Phrases", grammar: "Grammar", culture: "Culture & food" },
      kind1: { word: "Word", phrase: "Phrase", grammar: "Grammar", culture: "Culture" },
      results: n => `${n} ${n === 1 ? "entry" : "entries"}`, none: "No entries found.",
      back: "Back", meaning: "Meaning", standard: "Standard Japanese", examples: "Examples", source: "Source",
      check: "Ask a local", noSrc: "No official Nagasaki source found yet.", checkNote: "Widely used in Kyushu, but not confirmed in the official Nagasaki sources used here. A good one to check with friends!",
      share: "Send to a friend to check", copied: "Copied — paste it to your friend", prev: "Previous", next: "Next",
      quizTitle: "Quiz", quizLead: "What does it mean? 10 questions.", start: "Start", whatMeans: "What does this mean?",
      right: "Correct!", wrong: "Not quite —", nextQ: "Next", finish: "See score", again: "Play again", yourScore: "Your score",
      shareHead: "Is this right? (Nagasaki-ben)", shareMean: "Meaning", shareEx: "Example",
      aboutTitle: "About this dictionary"
    },
    ja: {
      brandSub: "長崎弁辞典", tabHome: "ホーム", tabBrowse: "一覧", tabQuiz: "クイズ", tabAbout: "について",
      heroTitle: "長崎弁を学ぼう", heroLead: "{n}語の長崎弁。実際の例文つき。",
      search: "検索：かな・漢字・ローマ字・英語", today: "今日のことば", seeEntry: "くわしく見る",
      bySound: "五十音で探す", byKind: "種類で探す", all: "すべて",
      kinds: { word: "単語", phrase: "フレーズ", grammar: "文法", culture: "文化・食べ物" },
      kind1: { word: "単語", phrase: "フレーズ", grammar: "文法", culture: "文化" },
      results: n => `${n}件`, none: "見つかりませんでした。",
      back: "戻る", meaning: "意味", standard: "標準語", examples: "例文", source: "出典",
      check: "要確認", noSrc: "長崎の公的資料ではまだ確認できていません。", checkNote: "九州で広く使われる言葉ですが、ここで使った長崎の公的資料では確認できていません。地元の人に確かめてください。",
      share: "友だちに送って確認する", copied: "コピーしました", prev: "前へ", next: "次へ",
      quizTitle: "クイズ", quizLead: "どういう意味？全10問。", start: "スタート", whatMeans: "標準語でどういう意味？",
      right: "正解！", wrong: "ざんねん…", nextQ: "次へ", finish: "結果を見る", again: "もう一度", yourScore: "あなたの点数",
      shareHead: "この長崎弁、合ってる？", shareMean: "意味", shareEx: "例文",
      aboutTitle: "この辞典について"
    }
  };
  const GYO = [["あ","あいうえお"],["か","かきくけこがぎぐげご"],["さ","さしすせそざじずぜぞ"],["た","たちつてとだぢづでどっ"],["な","なにぬねの"],
    ["は","はひふへほばびぶべぼぱぴぷぺぽ"],["ま","まみむめも"],["や","やゆよ"],["ら","らりるれろ"],["わ","わをん"]];

  let lang = store.get("nb-lang", (navigator.language || "en").startsWith("ja") ? "ja" : "en");
  const t = () => T[lang];

  // ── text helpers ──
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const RUBY = /([一-鿿々〆ヶ]+)\[([^\]]+)\]/g;
  const ruby = s => esc(s).replace(RUBY, "<ruby>$1<rt>$2</rt></ruby>");
  const plain = s => String(s).replace(RUBY, "$1");
  const kata2hira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));

  const R = { あ:"a",い:"i",う:"u",え:"e",お:"o",か:"ka",き:"ki",く:"ku",け:"ke",こ:"ko",さ:"sa",し:"shi",す:"su",せ:"se",そ:"so",
    た:"ta",ち:"chi",つ:"tsu",て:"te",と:"to",な:"na",に:"ni",ぬ:"nu",ね:"ne",の:"no",は:"ha",ひ:"hi",ふ:"fu",へ:"he",ほ:"ho",
    ま:"ma",み:"mi",む:"mu",め:"me",も:"mo",や:"ya",ゆ:"yu",よ:"yo",ら:"ra",り:"ri",る:"ru",れ:"re",ろ:"ro",わ:"wa",を:"o",ん:"n",
    が:"ga",ぎ:"gi",ぐ:"gu",げ:"ge",ご:"go",ざ:"za",じ:"ji",ず:"zu",ぜ:"ze",ぞ:"zo",だ:"da",ぢ:"ji",づ:"zu",で:"de",ど:"do",
    ば:"ba",び:"bi",ぶ:"bu",べ:"be",ぼ:"bo",ぱ:"pa",ぴ:"pi",ぷ:"pu",ぺ:"pe",ぽ:"po",ぁ:"a",ぃ:"i",ぅ:"u",ぇ:"e",ぉ:"o" };
  function romaji(h) {
    h = kata2hira(h); let out = "";
    for (let i = 0; i < h.length; i++) {
      const c = h[i], n = h[i + 1];
      if (c === "っ") { const nx = romaji(h.slice(i + 1, i + 3)); out += nx ? (nx.startsWith("ch") ? "t" : nx[0]) : ""; continue; }
      if (c === "ー") { const m = out.match(/[aiueo]$/); out += m ? m[0] : ""; continue; }
      if (n && "ゃゅょ".includes(n)) {
        const base = R[c] || ""; const y = { ゃ: "a", ゅ: "u", ょ: "o" }[n];
        out += /^(shi|chi|ji)$/.test(base) ? base.slice(0, -1) + y : base.slice(0, -1) + "y" + y; i++; continue;
      }
      if (c === "ん" && n && "あいうえおやゆよ".includes(n)) { out += "n'"; continue; }
      out += R[c] !== undefined ? R[c] : (/[〜～]/.test(c) ? "~" : "");
    }
    return out;
  }
  const norm = s => kata2hira(plain(s).normalize("NFKC").toLowerCase()).replace(/[〜～\s・／/、。！？!?「」]/g, "");
  ENTRIES.forEach(e => {
    e.rom = romaji(e.r);
    e.hay = [e.d, e.r, e.rom, e.en, e.std, e.nJa || ""].map(norm).join("|") + "|" + e.rom.replace(/'/g, "");
    const first = e.r.normalize("NFD")[0].normalize("NFC");
    const g = GYO.find(([, set]) => set.includes(kata2hira(e.r[0])) || set.includes(first));
    e.gyo = g ? g[0] : "あ";
  });
  const byId = Object.fromEntries(ENTRIES.map(e => [e.id, e]));
  const sorted = ENTRIES.slice().sort((a, b) => a.r.localeCompare(b.r, "ja"));

  const mean = e => lang === "ja" ? plain(e.std) : e.en;
  const kindBadge = e => `<span class="badge b-${e.k}">${t().kind1[e.k]}</span>`;
  const checkBadge = e => e.check ? `<span class="badge b-check">${t().check}</span>` : "";
  const readingLine = e => `${esc(e.r)} · ${esc(e.rom)}`;

  // ── chrome ──
  function applyChrome() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-t]").forEach(el => { el.textContent = t()[el.dataset.t]; });
    document.querySelectorAll(".lang button").forEach(b => b.classList.toggle("on", b.dataset.lang === lang));
  }
  document.querySelectorAll(".lang button").forEach(b => b.addEventListener("click", () => {
    lang = b.dataset.lang; store.set("nb-lang", lang); applyChrome(); render();
  }));
  if (store.get("nb-size", "") === "large") document.documentElement.classList.add("large");
  document.getElementById("sizeBtn").addEventListener("click", () => {
    const on = document.documentElement.classList.toggle("large");
    store.set("nb-size", on ? "large" : "");
  });
  let toastTimer;
  function toast(msg) {
    const el = document.getElementById("toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  // ── router ──
  const app = document.getElementById("app");
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [path, qs] = h.split("?");
    const parts = path.split("/").filter(Boolean);
    return { name: parts[0] || "home", arg: parts[1] ? decodeURIComponent(parts[1]) : null, q: new URLSearchParams(qs || "") };
  }
  function setTab(name) {
    const tab = name === "entry" ? "browse" : name;
    document.querySelectorAll(".tabs a").forEach(a => a.classList.toggle("on", a.dataset.tab === tab));
  }
  let lastName = "";
  function render() {
    const r = route(); setTab(r.name);
    const views = { home, browse, entry, quiz, about };
    (views[r.name] || home)(r);
    if (r.name !== lastName || r.name === "entry") window.scrollTo(0, 0);
    lastName = r.name;
  }
  window.addEventListener("hashchange", render);

  // ── views ──
  function dailyEntry() {
    const d = new Date(); const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    let h = 0; for (const c of key) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
    const pool = ENTRIES.filter(e => e.k !== "grammar");
    return pool[Math.abs(h) % pool.length];
  }
  function searchBox(value) {
    return `<form class="search" id="searchForm" role="search">
      <input id="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="${esc(t().search)}" value="${esc(value || "")}" aria-label="${esc(t().search)}">
      <button type="submit" aria-label="Search">⌕</button></form>`;
  }

  function home() {
    const e = dailyEntry(); const ex = e.ex[0];
    const counts = {}; ENTRIES.forEach(x => counts[x.k] = (counts[x.k] || 0) + 1);
    const kindColors = { word: "b-word", phrase: "b-phrase", grammar: "b-grammar", culture: "b-culture" };
    app.innerHTML = `
      <section class="hero"><h1>${t().heroTitle}</h1><p class="lead">${t().heroLead.replace("{n}", ENTRIES.length)}</p></section>
      ${searchBox("")}
      <article class="card daily">
        <div class="daily__label">${t().today}</div>
        <div class="daily__word" lang="ja">${ruby(e.d)}</div>
        <div class="daily__reading">${readingLine(e)}</div>
        <div class="daily__mean">${esc(mean(e))}</div>
        ${lang === "en" ? `<div lang="ja">${ruby(e.std)}</div>` : ""}
        <div class="daily__ex" lang="ja"><div style="font-weight:700">${ruby(ex[0])}</div>
          <div style="opacity:.85">${lang === "en" ? esc(ex[2]) : ruby(ex[1])}</div></div>
        <a class="btn btn--light" href="#/entry/${e.id}">${t().seeEntry} →</a>
      </article>
      <h2>${t().bySound}</h2>
      <div class="kana-grid" lang="ja">${GYO.map(([g]) => `<a href="#/browse?g=${g}">${g}</a>`).join("")}</div>
      <h2>${t().byKind}</h2>
      <div class="kind-grid">${Object.keys(t().kinds).map(k =>
        `<a class="${kindColors[k]}" href="#/browse?k=${k}">${t().kinds[k]}<small>${t().results(counts[k] || 0)}</small></a>`).join("")}</div>`;
    bindSearch();
  }

  function bindSearch(live) {
    const form = document.getElementById("searchForm"); const input = document.getElementById("q");
    form.addEventListener("submit", ev => {
      ev.preventDefault(); input.blur();
      const r = route(); const p = live ? r.q : new URLSearchParams();
      input.value.trim() ? p.set("q", input.value.trim()) : p.delete("q");
      location.hash = "#/browse" + (p.toString() ? "?" + p : "");
    });
    if (live) {
      input.addEventListener("input", () => {
        const p = route().q; input.value.trim() ? p.set("q", input.value.trim()) : p.delete("q");
        history.replaceState(null, "", "#/browse" + (p.toString() ? "?" + p : ""));
        drawList();
      });
    }
  }

  function browse(r) {
    const q = r.q.get("q") || ""; const k = r.q.get("k") || ""; const g = r.q.get("g") || "";
    const link = (key, val) => { const p = new URLSearchParams(r.q); val ? p.set(key, val) : p.delete(key); return "#/browse" + (p.toString() ? "?" + p : ""); };
    app.innerHTML = `
      <div class="sticky-tools">
        ${searchBox(q)}
        <div class="chips" aria-label="type">
          <a class="chip ${!k ? "on" : ""}" href="${link("k", "")}">${t().all}</a>
          ${Object.keys(t().kinds).map(x => `<a class="chip ${k === x ? "on" : ""}" href="${link("k", x)}">${t().kinds[x]}</a>`).join("")}
        </div>
        <div class="chips" lang="ja" aria-label="kana">
          <a class="chip chip--kana ${!g ? "on" : ""}" href="${link("g", "")}">${lang === "ja" ? "全" : "All"}</a>
          ${GYO.map(([x]) => `<a class="chip chip--kana ${g === x ? "on" : ""}" href="${link("g", x)}">${x}</a>`).join("")}
        </div>
      </div>
      <p class="count" id="count"></p>
      <ul class="list" id="list"></ul>`;
    bindSearch(true);
    drawList();
  }
  function drawList() {
    const r = route(); const q = norm(r.q.get("q") || ""); const k = r.q.get("k"); const g = r.q.get("g");
    const items = sorted.filter(e => (!k || e.k === k) && (!g || e.gyo === g) && (!q || e.hay.includes(q)));
    document.getElementById("count").textContent = t().results(items.length);
    document.getElementById("list").innerHTML = items.length ? items.map(e => `
      <li><a class="row" href="#/entry/${e.id}">
        <div class="row__top"><span class="row__word" lang="ja">${ruby(e.d)}</span><span>${checkBadge(e)} ${kindBadge(e)}</span></div>
        <div class="row__reading">${readingLine(e)}</div>
        <div class="row__mean" ${lang === "ja" ? 'lang="ja"' : ""}>${lang === "ja" ? ruby(e.std) : esc(e.en)}</div>
      </a></li>`).join("") : `<li class="empty">${t().none}</li>`;
  }

  function sourcesHtml(e) {
    return [].concat(e.src).map(k => SOURCES[k]).filter(Boolean)
      .map(s => `<a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(s.l)}</a>`).join("<br>") || esc(t().noSrc);
  }

  function entry(r) {
    const e = byId[r.arg];
    if (!e) { app.innerHTML = `<p class="empty">${t().none}</p>`; return; }
    const i = sorted.indexOf(e); const prev = sorted[(i - 1 + sorted.length) % sorted.length]; const next = sorted[(i + 1) % sorted.length];
    const note = lang === "ja" ? e.nJa : e.nEn;
    app.innerHTML = `
      <a class="back" href="javascript:history.back()">← ${t().back}</a>
      <article class="card entry__head">
        <div class="entry__badges">${kindBadge(e)} ${checkBadge(e)}</div>
        <div class="entry__word" lang="ja">${ruby(e.d)}</div>
        <div class="entry__reading">${readingLine(e)}</div>
      </article>
      <section class="card meaning">
        ${lang === "ja"
          ? `<div class="meaning__main" lang="ja">${ruby(e.std)}</div>`
          : `<div class="meaning__main">${esc(e.en)}</div><div class="meaning__sub" lang="ja"><b>${t().standard}</b>${ruby(e.std)}</div>`}
        ${note ? `<div class="note" ${lang === "ja" ? 'lang="ja"' : ""}>${lang === "ja" ? ruby(note) : esc(note)}</div>` : ""}
        ${e.check ? `<div class="check-note">${t().checkNote}</div>` : ""}
      </section>
      <h2>${t().examples}</h2>
      ${e.ex.map(x => `<div class="ex"><div class="ex__d" lang="ja">${ruby(x[0])}</div>
        <div class="ex__s" lang="ja">${ruby(x[1])}</div>${lang === "en" ? `<div class="ex__e">${esc(x[2])}</div>` : ""}</div>`).join("")}
      <div class="actions"><button class="btn btn--ghost btn--wide" id="shareBtn" type="button">💬 ${t().share}</button></div>
      <h2>${t().source}</h2>
      <p class="src">${sourcesHtml(e)}</p>
      <nav class="pager">
        <a href="#/entry/${prev.id}"><small>← ${t().prev}</small><span lang="ja">${esc(plain(prev.d))}</span></a>
        <a class="next" href="#/entry/${next.id}"><small>${t().next} →</small><span lang="ja">${esc(plain(next.d))}</span></a>
      </nav>`;
    document.getElementById("shareBtn").addEventListener("click", () => shareEntry(e));
    swipe(prev, next);
  }

  function shareEntry(e) {
    const J = T.ja;
    const text = `${J.shareHead}\n「${plain(e.d)}」(${e.r})\n${J.shareMean}：${plain(e.std)}\n${J.shareEx}：${plain(e.ex[0][0])}\n→ ${plain(e.ex[0][1])}`;
    const url = location.href.split("#")[0] + "#/entry/" + e.id;
    if (navigator.share) { navigator.share({ text: text + "\n", url }).catch(() => {}); return; }
    const done = () => toast(t().copied);
    if (navigator.clipboard) navigator.clipboard.writeText(text + "\n" + url).then(done, done);
    else done();
  }

  let swipeOff = null;
  function swipe(prev, next) {
    if (swipeOff) swipeOff();
    let x0 = null, y0 = null;
    const s = ev => { x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY; };
    const en = ev => {
      if (x0 === null) return;
      const dx = ev.changedTouches[0].clientX - x0, dy = ev.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 2) location.hash = "#/entry/" + (dx < 0 ? next.id : prev.id);
    };
    app.addEventListener("touchstart", s, { passive: true }); app.addEventListener("touchend", en);
    swipeOff = () => { app.removeEventListener("touchstart", s); app.removeEventListener("touchend", en); swipeOff = null; };
  }

  // quiz
  let Q = null;
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function newQuiz() {
    const pool = shuffle(ENTRIES.filter(e => e.k !== "grammar")).slice(0, 10);
    Q = { items: pool.map(e => ({ e, opts: shuffle([e, ...shuffle(ENTRIES.filter(x => x !== e && x.k !== "grammar")).slice(0, 3)]) })), i: 0, score: 0, picked: null };
  }
  function quiz() {
    if (swipeOff) swipeOff();
    if (!Q) {
      app.innerHTML = `<h1>${t().quizTitle}</h1><p class="lead">${t().quizLead}</p>
        <button class="btn btn--wide" id="startQ">${t().start}</button>`;
      document.getElementById("startQ").onclick = () => { newQuiz(); quiz(); };
      return;
    }
    if (Q.i >= Q.items.length) {
      app.innerHTML = `<div class="card" style="text-align:center"><p class="muted" style="margin:0">${t().yourScore}</p>
        <p class="score">${Q.score} / ${Q.items.length}</p></div>
        <div class="actions"><button class="btn btn--wide" id="againQ">${t().again}</button></div>`;
      document.getElementById("againQ").onclick = () => { newQuiz(); quiz(); };
      return;
    }
    const it = Q.items[Q.i]; const done = Q.picked !== null;
    app.innerHTML = `
      <div class="quiz__progress"><div style="width:${(Q.i / Q.items.length) * 100}%"></div></div>
      <div class="card quiz__q"><div class="quiz__prompt">${Q.i + 1} / ${Q.items.length} · ${t().whatMeans}</div>
        <div class="quiz__word" lang="ja">${ruby(it.e.d)}</div><div class="muted">${readingLine(it.e)}</div></div>
      <div class="choices">${it.opts.map((o, n) => {
        let cls = "choice"; if (done) { if (o === it.e) cls += " right"; else if (n === Q.picked) cls += " wrong"; }
        return `<button class="${cls}" data-n="${n}" ${done ? "disabled" : ""} ${lang === "ja" ? 'lang="ja"' : ""}>${esc(lang === "ja" ? plain(o.std) : o.en)}</button>`;
      }).join("")}</div>
      ${done ? `<p class="feedback">${it.opts[Q.picked] === it.e ? "✅ " + t().right : "❌ " + t().wrong + " " + esc(mean(it.e))}</p>
        <div class="actions"><a class="btn btn--ghost btn--wide" href="#/entry/${it.e.id}">${t().seeEntry}</a>
        <button class="btn btn--wide" id="nextQ">${Q.i + 1 === Q.items.length ? t().finish : t().nextQ} →</button></div>` : ""}`;
    app.querySelectorAll(".choice").forEach(b => b.onclick = () => {
      Q.picked = +b.dataset.n; if (it.opts[Q.picked] === it.e) Q.score++; quiz();
    });
    const nx = document.getElementById("nextQ"); if (nx) nx.onclick = () => { Q.i++; Q.picked = null; quiz(); window.scrollTo(0, 0); };
  }

  function about() {
    if (swipeOff) swipeOff();
    const checked = ENTRIES.filter(e => e.check).length;
    const en = `
      <h1>${t().aboutTitle}</h1>
      <div class="prose">
      <p>A learner's dictionary of Nagasaki-ben (長崎弁), the dialect of mainland Nagasaki Prefecture. Every entry has the standard Japanese meaning, an English meaning and example sentences.</p>
      <h2>Where the entries come from</h2>
      <ul>
        <li><a href="${SOURCES.kids.u}" target="_blank" rel="noopener">Nagasaki City's illustrated dialect page for children</a></li>
        <li>Nagasaki City's long-running <i>Jigemon Mōtokkun</i> column (ナガジン), which pairs native dialect dialogues with standard Japanese. Many example sentences here come from it.</li>
        <li>The Japanese and English Wikipedia articles on the dialect, for grammar.</li>
      </ul>
      <p>${checked} entries are marked <span class="badge b-check">${T.en.check}</span>. They're common Kyushu words that weren't confirmed in those sources, so please check them with local friends.</p>
      <h2>Checking with Japanese friends</h2>
      <p>Tap <b>日本語</b> at the top to switch the whole site into Japanese. On any entry, the <b>💬 send to a friend</b> button shares the word, meaning and example so they can tell you if it sounds right.</p>
      <p>Usage varies by area (Sasebo, Isahaya, Shimabara, Gotō…) and by age. Some words here are mostly used by older people.</p>
      </div>`;
    const ja = `
      <h1>${t().aboutTitle}</h1>
      <div class="prose" lang="ja">
      <p>長崎県本土で話される長崎弁の学習者向け辞典です。各項目に標準語の意味・英語の意味・例文をのせています。</p>
      <h2>出典</h2>
      <ul>
        <li><a href="${SOURCES.kids.u}" target="_blank" rel="noopener">長崎市「イラストで学ぶ長崎弁」</a></li>
        <li>長崎市ナガジン「ジゲモン猛特訓」（例文の多くはここから）</li>
        <li>Wikipedia「長崎弁」（文法）</li>
      </ul>
      <p><span class="badge b-check">${T.ja.check}</span> の${checked}語は九州で広く使われる言葉ですが、上の資料では確認できていません。</p>
      <h2>まちがいを見つけたら</h2>
      <p>各ページの「💬 友だちに送って確認する」ボタンで、言葉・意味・例文を送れます。地域（佐世保・諫早・島原・五島など）や年代によって使い方がちがうことがあります。</p>
      </div>`;
    app.innerHTML = lang === "ja" ? ja : en;
  }

  applyChrome();
  render();
})();
