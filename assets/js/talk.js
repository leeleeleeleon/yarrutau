/* 말 시키기: 홈페이지 캐릭터 음원으로 짧은 대사를 읽어 주는 TTS
   음원 엔진(가나 변환, 억양, PSOLA)은 「말하는 우타우」에서 가져왔습니다. */
(() => {
"use strict";
const root = document.getElementById('talk-root');
if (!root) return;
const SR = 44100;
let VB = null;
/* ---------------- Kana tables ---------------- */
const KANA2ROMA = {};
const def = (k, r) => { if (!(k in KANA2ROMA)) KANA2ROMA[k] = r; };
const VOW = 'aiueo';
[['','あいうえお'],['k','かきくけこ'],['g','がぎぐげご'],['s','さしすせそ'],['z','ざじずぜぞ'],['t','たちつてと'],['d','だぢづでど'],['n','なにぬねの'],['h','はひふへほ'],['b','ばびぶべぼ'],['p','ぱぴぷぺぽ'],['m','まみむめも'],['r','らりるれろ']]
  .forEach(([c,row]) => [...row].forEach((k,i) => def(k, ({'し':'shi','じ':'ji','ち':'chi','つ':'tsu','ぢ':'ji','づ':'zu','ふ':'fu'})[k] || c + VOW[i])));
Object.entries({'や':'ya','ゆ':'yu','よ':'yo','わ':'wa','を':'o','ん':'n','ゔ':'vu'}).forEach(([k,r]) => def(k,r));
Object.entries({'き':'ky','ぎ':'gy','し':'sh','じ':'j','ち':'ch','に':'ny','ひ':'hy','び':'by','ぴ':'py','み':'my','り':'ry'})
  .forEach(([k,c]) => { def(k+'ゃ',c+'a'); def(k+'ゅ',c+'u'); def(k+'ょ',c+'o'); });
Object.entries({'しぇ':'she','ちぇ':'che','じぇ':'je','ふぁ':'fa','ふぃ':'fi','ふぇ':'fe','ふぉ':'fo','ふゅ':'fyu','てぃ':'ti','でぃ':'di','とぅ':'tu','どぅ':'du','てゅ':'tyu','でゅ':'dyu',
  'うぃ':'wi','うぇ':'we','うぉ':'wo','いぇ':'ye','つぁ':'tsa','つぃ':'tsi','つぇ':'tse','つぉ':'tso','ゔぁ':'va','ゔぃ':'vi','ゔぇ':'ve','ゔぉ':'vo','くぁ':'kwa','ぐぁ':'gwa','すぃ':'si','ずぃ':'zi'})
  .forEach(([k,r]) => def(k,r));
const R2K = {}; for (const [k,r] of Object.entries(KANA2ROMA)) if (!(r in R2K)) R2K[r] = k;
const IN2K = Object.assign({}, R2K, {si:'し',ti:'ち',tu:'つ',hu:'ふ',zi:'じ',di:'ぢ',du:'づ',wo:'を',
  sya:'しゃ',syu:'しゅ',syo:'しょ',tya:'ちゃ',tyu:'ちゅ',tyo:'ちょ',cya:'ちゃ',cyu:'ちゅ',cyo:'ちょ',zya:'じゃ',zyu:'じゅ',zyo:'じょ',jya:'じゃ',jyu:'じゅ',jyo:'じょ',
  nn:'ん',"n'":'ん',la:'ぁ',li:'ぃ',lu:'ぅ',le:'ぇ',lo:'ぉ',xa:'ぁ',xi:'ぃ',xu:'ぅ',xe:'ぇ',xo:'ぉ',ltu:'っ',xtu:'っ',lya:'ゃ',lyu:'ゅ',lyo:'ょ'});
const SMALL = 'ぁぃぅぇぉゃゅょゎ';
const SMALL_BIG = {'ぁ':'あ','ぃ':'い','ぅ':'う','ぇ':'え','ぉ':'お','ゃ':'や','ゅ':'ゆ','ょ':'よ','ゎ':'わ'};
const toHira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
const toKata = s => s.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));

function romajiToKana(s) {
  s = s.toLowerCase(); let out = '', i = 0;
  while (i < s.length) {
    const c = s[i], n1 = s[i+1] || '', n2 = s[i+2] || '';
    if (c === 'n' && !/[aiueoy]/.test(n1)) {
      out += 'ん'; i += (n1 === "'" || (n1 === 'n' && !/[aiueoy]/.test(n2))) ? 2 : 1; continue;
    }
    if (c === n1 && /[bcdfghjkmpqrstvwxz]/.test(c)) { out += 'っ'; i++; continue; }
    if (c === '-') { out += 'ー'; i++; continue; }
    let hit = false;
    for (let L = 4; L >= 1; L--) {
      const k = IN2K[s.substr(i, L)];
      if (k) { out += k; i += L; hit = true; break; }
    }
    if (!hit) i++;
  }
  return out;
}

/* ---------------- Hangul → kana (with Korean sound rules) ---------------- */
const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNG_V = ['a','e','ya','ye','o','e','yo','ye','o','wa','we','we','yo','u','wo','we','wi','yu','u','ui','i'];
const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JSPLIT = {'ㄳ':['ㄱ','ㅅ'],'ㄵ':['ㄴ','ㅈ'],'ㄶ':['ㄴ','ㅎ'],'ㄺ':['ㄹ','ㄱ'],'ㄻ':['ㄹ','ㅁ'],'ㄼ':['ㄹ','ㅂ'],'ㄽ':['ㄹ','ㅅ'],'ㄾ':['ㄹ','ㅌ'],'ㄿ':['ㄹ','ㅍ'],'ㅀ':['ㄹ','ㅎ'],'ㅄ':['ㅂ','ㅅ']};
const REP = {'ㄱ':'K','ㄲ':'K','ㅋ':'K','ㄳ':'K','ㄺ':'K','ㄴ':'N','ㄵ':'N','ㄶ':'N','ㄷ':'T','ㅅ':'T','ㅆ':'T','ㅈ':'T','ㅊ':'T','ㅌ':'T','ㅎ':'T',
  'ㄹ':'L','ㄼ':'L','ㄽ':'L','ㄾ':'L','ㅀ':'L','ㅁ':'M','ㄻ':'M','ㅂ':'P','ㅍ':'P','ㅄ':'P','ㄿ':'P','ㅇ':'NG'};
const CONS_RO = {'ㄱ':['k','g'],'ㄲ':['k','k'],'ㄴ':['n','n'],'ㄷ':['t','d'],'ㄸ':['t','t'],'ㄹ':['r','r'],'ㅁ':['m','m'],'ㅂ':['p','b'],'ㅃ':['p','p'],
  'ㅅ':['s','s'],'ㅆ':['s','s'],'ㅇ':['',''],'ㅈ':['ch','j'],'ㅉ':['ch','ch'],'ㅊ':['ch','ch'],'ㅋ':['k','k'],'ㅌ':['t','t'],'ㅍ':['p','p'],'ㅎ':['h','h']};

function cvKana(c, v) {
  if (v === 'ui') return [...cvKana(c, 'u'), 'い'];
  if (c === 's' && v === 'i') c = 'sh';
  if (c === 's' && v[0] === 'y') { c = 'sh'; v = v.slice(1); }
  if ((c === 'ch' || c === 'j' || c === 'sh') && v[0] === 'y' && v.length > 1) v = v.slice(1);
  const r = c + v;
  if (R2K[r]) return [R2K[r]];
  if (v[0] === 'y') { const b = R2K[c+'i'] || IN2K[c+'i']; if (b) return [b[0] + ({a:'ゃ',u:'ゅ',o:'ょ',e:'ぇ'})[v[1]]]; }
  if (v[0] === 'w') { const b = IN2K[c+'u']; if (b) return [b[0] + ({a:'ぁ',i:'ぃ',e:'ぇ',o:'ぉ'})[v[1]]]; }
  if (IN2K[r]) return [IN2K[r]];
  return [R2K[v.slice(-1)] || 'あ'];
}

function hangulWord(word) {
  const syl = [...word].map(ch => { const i = ch.charCodeAt(0) - 0xAC00;
    return { cho: CHO[Math.floor(i / 588)], v: JUNG_V[Math.floor((i % 588) / 28)], jong: JONG[i % 28], tense: false }; });
  for (let i = 0; i < syl.length - 1; i++) {
    const s = syl[i], nx = syl[i+1];
    if (!s.jong) continue;
    if (nx.cho === 'ㅇ') {                       // 연음: 받침이 다음 음절로 넘어감
      if (s.jong === 'ㅇ') continue;
      if (JSPLIT[s.jong]) { const [a, b] = JSPLIT[s.jong]; s.jong = a; nx.cho = b === 'ㅎ' ? 'ㅇ' : b; }
      else if (s.jong === 'ㅎ') s.jong = '';
      else { nx.cho = s.jong; s.jong = ''; }
      if (nx.v === 'i' && (nx.cho === 'ㄷ' || nx.cho === 'ㅌ')) nx.cho = nx.cho === 'ㄷ' ? 'ㅈ' : 'ㅊ';   // 구개음화 (같이 → 가치)
      continue;
    }
    if ((s.jong === 'ㅎ' || s.jong === 'ㄶ' || s.jong === 'ㅀ') && 'ㄱㄷㅈ'.includes(nx.cho)) {   // 격음화
      nx.cho = ({'ㄱ':'ㅋ','ㄷ':'ㅌ','ㅈ':'ㅊ'})[nx.cho]; s.jong = s.jong === 'ㅎ' ? '' : (s.jong === 'ㄶ' ? 'ㄴ' : 'ㄹ'); continue;
    }
    const r = REP[s.jong];
    if (nx.cho === 'ㅎ' && 'KTP'.includes(r)) { nx.cho = ({K:'ㅋ',T:'ㅌ',P:'ㅍ'})[r]; s.jong = ''; continue; }
    if ('ㄴㅁ'.includes(nx.cho) && 'KTP'.includes(r)) { s.jong = ({K:'ㅇ',T:'ㄴ',P:'ㅁ'})[r]; continue; }  // 비음화
    if (nx.cho === 'ㄹ' && r === 'N') { s.jong = 'ㄹ'; continue; }                                   // 유음화
    if (nx.cho === 'ㄴ' && r === 'L') { nx.cho = 'ㄹ'; continue; }
    if (nx.cho === 'ㄹ' && (r === 'M' || r === 'NG')) { nx.cho = 'ㄴ'; continue; }
    if ('KTP'.includes(r) && 'ㄱㄷㅂㅅㅈ'.includes(nx.cho)) nx.tense = true;                      // 경음화
  }
  const out = [];
  syl.forEach((s, i) => {
    const prevRep = i > 0 ? (REP[syl[i-1].jong] || '') : null;
    const voiced = i > 0 && !s.tense && ['', 'N', 'M', 'NG', 'L'].includes(prevRep);
    const c = CONS_RO[s.cho][voiced ? 1 : 0];
    let v = s.v; if (v === 'ui' && s.cho !== 'ㅇ') v = 'i';
    const hi = s.tense || 'ㄲㄸㅃㅆㅉㅊㅋㅌㅍㅎㅅ'.includes(s.cho);
    cvKana(c, v).forEach((k, j) => out.push({ kana: k, dur: (s.v === 'ui' && j === 0) ? 0.6 : 1, hi, wordStart: i === 0 && j === 0, src: j === 0 ? word[i] : '' }));
    const r = REP[s.jong];
    if (r === 'N' || r === 'M' || r === 'NG') out.push({ kana: 'ん', dur: 0.72, coda: r });
    else if (r === 'L') out.push({ kana: 'る', dur: 0.42, coda: 'L' });
    else if (r) out.push({ kana: 'っ', dur: 0.42 });
  });
  return out;
}

function kanaRun(s) {
  s = toHira(s).replace(/こんにちは/g, 'こんにちわ').replace(/こんばんは/g, 'こんばんわ');
  if (s.length >= 3 && s.endsWith('は')) s = s.slice(0, -1) + 'わ';   // 助詞「は」
  const out = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i], n = s[i+1];
    if (n && SMALL.includes(n) && KANA2ROMA[c + n]) { out.push({ kana: c + n }); i++; continue; }
    if (n && SMALL.includes(n) && 'ぁぃぅぇぉゃゅょ'.includes(n) && KANA2ROMA[c]) { out.push({ kana: c + n }); i++; continue; }
    if (c === 'っ') out.push({ kana: 'っ', dur: 0.75 });
    else if (c === 'ー') { const last = out[out.length - 1]; if (last && last.kana !== 'っ') last.dur = (last.dur || 1) + 0.9; }
    else if (SMALL.includes(c)) out.push({ kana: SMALL_BIG[c] });
    else if (KANA2ROMA[c]) out.push({ kana: c });
  }
  if (out.length) out[0].wordStart = true;
  return out;
}

function mk(o) {
  const k = o.kana;
  if (k === 'っ') return Object.assign({ dur: 1 }, o, { roma: '', cons: '', vowel: '', rest: true });
  let r = KANA2ROMA[k];
  if (!r && k.length === 2) {
    const b = KANA2ROMA[k[0]] || 'u', sm = k[1];
    const base = b.length > 1 ? b.slice(0, -1) : '';
    const bv = b.slice(-1);
    if ('ゃゅょ'.includes(sm)) r = base + 'y' + ({'ゃ':'a','ゅ':'u','ょ':'o'})[sm];
    else { const v = ({'ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o'})[sm] || 'a'; r = base + (bv === 'i' ? 'y' : bv === 'u' ? 'w' : '') + v; }
  }
  r = r || 'a';
  let vowel = r.slice(-1), cons = r.slice(0, -1);
  if (r === 'n') { vowel = 'n'; cons = ''; }
  return Object.assign({ dur: 1 }, o, { roma: r, cons, vowel });
}

/* ---------------- Text → phrases ---------------- */
function textToPhrases(text) {
  text = text.normalize('NFKC');
  const phrases = []; let cur = { moras: [] }; const skipped = new Set();
  const close = (end, cnt = 1) => {
    if (cur.moras.length) { cur.end = end; cur.cnt = cnt; phrases.push(cur); }
    else if (phrases.length && end !== ',' && phrases[phrases.length - 1].end !== end) {   // "...!" 처럼 이어진 부호는 앞 구절에 합침
      const pv = phrases[phrases.length - 1]; if (end === '?' || end === '!') { pv.end = end; pv.cnt = cnt; }
    }
    cur = { moras: [] };
  };
  const re = /([가-힣]+)|([ぁ-ゖァ-ヺー]+)|([A-Za-z']+)|([,、，;；:]+)|([.。…\n]+)|([?？]+)|([!！]+)|(\s+)|([~〜～∼]+)|(.)/g;
  let m, hasKo = false, gapNext = false;
  const push = list => list.forEach((o, i) => { const x = mk(o); if (i === 0 && gapNext && cur.moras.length) { x.gap = true; x.wordStart = true; } cur.moras.push(x); gapNext = false; });
  while ((m = re.exec(text))) {
    if (m[1]) { hasKo = true; push(hangulWord(m[1])); }
    else if (m[2]) push(kanaRun(m[2]));
    else if (m[3]) push(kanaRun(romajiToKana(m[3])));
    else if (m[8]) gapNext = true;                       // 띄어쓰기 → 짧은 쉼
    else if (m[4]) close(',');
    else if (m[5]) close(/…|\.\./.test(m[5]) ? '…' : '.');     // 말줄임표는 머뭇거리는 긴 쉼
    else if (m[6]) close('?', m[6].length);
    else if (m[7]) close('!', m[7].length);
    else if (m[9]) {                                      // 물결표: 앞 글자를 늘이며 흥얼거리듯
      const last = cur.moras[cur.moras.length - 1] || phrases[phrases.length - 1]?.moras.slice(-1)[0];
      if (last && !last.rest) last.tilde = (last.tilde || 0) + m[9].length;
    }
    else if (m[10] && /[一-鿿]/.test(m[10])) skipped.add(m[10]);
  }
  close('.');
  return { phrases, hasKo, skipped: [...skipped] };
}

/* ---------------- Prosody ---------------- */
const VOICELESS = new Set(['k','s','sh','t','ch','ts','h','f','p','ky','hy','py']);
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h; }

function makePlan(opts) {
  const { text, base, rate, range, wob, langSel, breath, gap } = opts;
  const parsed = textToPhrases(text);
  const lang = langSel === 'auto' ? (parsed.hasKo ? 'ko' : 'ja') : langSel;
  const rnd = mulberry(hashStr(text));
  const notes = []; let T = 0.35; const md = 1 / rate;
  const PAUSE = { ',': 0.26, '.': 0.45, '?': 0.48, '!': 0.42, '…': 0.72 };
  parsed.phrases.forEach((ph, pi) => {
    const ms = ph.moras, n = ms.length, end = ph.end;
    const cnt = Math.min(3, ph.cnt || 1);
    const exc = end === '!' ? 1.3 + 0.25 * cnt : 1, lift = end === '!' ? 0.6 + (0.6 + 0.2 * cnt) * range : 0;
    // 웃음(하하하·ははは): 같은 ㅎ 소리가 3번 넘게 이어지면 짧게 통통 튀게
    const laugh = new Array(n).fill(-1);
    for (let a = 0; a < n;) {
      let b = a; while (b < n && ms[b].cons === 'h' && ms[b].vowel === ms[a].vowel) b++;
      if (b - a >= 3) { for (let k = a; k < b; k++) laugh[k] = k - a; a = b; } else a++;
    }
    if (lang === 'ja') ms.forEach((m, j) => {           // 母音の無声化 (です → des)
      if (!'iu'.includes(m.vowel) || !VOICELESS.has(m.cons)) return;
      const nx = ms[j+1];
      if ((nx && !nx.rest && VOICELESS.has(nx.cons)) || (!nx && m.kana === 'す' && end !== '?')) m.devoice = true;
    });
    let wi = 0;
    ms.forEach((m, j) => {
      if (m.wordStart) wi = 0; else wi++;
      if (m.gap) T += (gap || 0) / 1000;
      let d = m.dur * md;
      if (j === n - 1) d *= end === '?' ? 1.5 : end === '…' ? 1.7 : 1.35;
      else if (j === n - 2 && n > 3) d *= end === '…' ? 1.25 : 1.1;   // 구절 끝으로 갈수록 살짝 느려짐
      const lg = laugh[j];
      if (lg >= 0 && j < n - 1) d *= 0.62;
      if (m.tilde) d *= Math.min(2.8, 1.8 + 0.4 * (m.tilde - 1));
      if (m.devoice) d *= 0.7;
      const prog = n > 1 ? j / (n - 1) : 0;
      let st = lift + range * exc * (1.3 - 2.6 * prog);   // declination
      if (lang === 'ja') {
        if (j === 0 && n > 1) st -= 2.2 * range * exc;
        else if (j === 1) st += 0.6 * range;
      } else {                                           // 서울말 강세구: 첫 음절 L(격음·경음이면 H), 둘째부터 올라감
        const wordLast = !ms[j+1] || ms[j+1].wordStart;
        if (wi === 0) st += (m.hi ? 0.3 : -0.8) * range * exc;
        else if (wi === 1) st += 0.7 * range;
        if (wordLast && j < n - 1 && wi > 0) st += 0.4 * range;
      }
      let stEnd = st;
      if (j === n - 1) {
        if (end === '?') { st -= 0.6 * range; stEnd = st + 6.5 * Math.max(range, 0.35); }
        else if (end === ',') stEnd = st + 1.2 * range;
        else if (end === '!') { st += 1.2 * range + 1; stEnd = st + (2.5 + cnt) * Math.max(range, 0.4); }   // 느낌표: 끝을 힘차게 올림
        else if (end === '…') { st -= 0.4 * range; stEnd = st - (1.6 + 2 * breath) * range; }          // 말끝을 흐림
        else { st -= (0.6 + breath) * range; stEnd = st - (1 + 2.2 * breath) * range; }
      }
      if (lg >= 0) { st += (lg % 2 ? -1.1 : 0.9) * Math.max(range, 0.5) - 0.35 * lg; stEnd = st; }
      let mid = null;
      if (m.tilde) { mid = st + 3.6 * Math.max(range, 0.6); stEnd = (j === n - 1 ? st - 1.5 * Math.max(range, 0.4) : st); }
      const jit = (rnd() - 0.5) * wob * 0.6; st += jit; stEnd += jit;
      const pn = notes[notes.length - 1];
      if (m.coda && pn && !pn.m.rest && j < n - 1) { st = pn.stEnd; stEnd = st; }   // 받침은 앞 음절 높이 그대로
      const ov = (opts.overrides || {})[notes.length];
      let vol = end === '!' ? 1.15 : 1;
      if (ov) { if (ov.dur) d *= ov.dur; if (ov.dst) { st += ov.dst; stEnd += ov.dst; } if (ov.bend) stEnd += ov.bend; if (ov.vol != null) vol *= ov.vol; }
      if (lg > 0) vol *= 0.92;
      notes.push({ m, T, d, st, stEnd, mid, vol, ov, pi, j, n, end, first: j === 0 || (!!m.gap && gap > 0), last: j === n - 1 });
      T += d;
    });
    T += (PAUSE[end] ?? 0.42) * Math.min(1.4, Math.max(0.7, 7.2 / rate));
  });
  const total = T + 0.35;
  // pitch control points → smooth curve (5 ms frames)
  const step = 0.005, nf = Math.ceil(total / step) + 2, st = new Float32Array(nf);
  const pts = [];
  notes.forEach(nt => {
    if (nt.m.rest) return;
    pts.push([nt.T + 0.12 * nt.d, nt.st]);
    if (nt.mid != null) pts.push([nt.T + 0.45 * nt.d, nt.mid]);
    pts.push([nt.T + 0.88 * nt.d, nt.stEnd]);
  });
  if (pts.length) {
    let k = 0;
    for (let f = 0; f < nf; f++) {
      const t = f * step;
      while (k < pts.length - 1 && pts[k+1][0] <= t) k++;
      if (t <= pts[0][0]) st[f] = pts[0][1];
      else if (k >= pts.length - 1) st[f] = pts[pts.length - 1][1];
      else { const [t0, a] = pts[k], [t1, b] = pts[k+1]; const u = (t - t0) / Math.max(1e-6, t1 - t0); st[f] = a + (b - a) * (0.5 - 0.5 * Math.cos(Math.PI * u)); }
    }
    for (let pass = 0; pass < 2; pass++) {             // 계단을 부드럽게 (떨림 방지)
      const R = 7, src = st.slice();
      for (let f = 0; f < nf; f++) { let s = 0, c = 0; for (let k = -R; k <= R; k++) { const g = f + k; if (g >= 0 && g < nf) { s += src[g]; c++; } } st[f] = s / c; }
    }
    const p1 = rnd() * 6.28, p2 = rnd() * 6.28;
    for (let f = 0; f < nf; f++) { const t = f * step; st[f] += wob * 0.1 * Math.sin(2 * Math.PI * 1.1 * t + p1) + 0 * p2; }
  }
  const stAt = t => { const x = t / step, i = Math.floor(x); if (i < 0) return st[0]; if (i >= nf - 1) return st[nf - 1]; return st[i] + (st[i+1] - st[i]) * (x - i); };
  const f0At = t => base * Math.pow(2, stAt(t) / 12);
  return { notes, total, st, step, stAt, f0At, base, lang, skipped: parsed.skipped, phrases: parsed.phrases };
}

const FALLBACK = { 'を':'お', 'ぢ':'じ', 'づ':'ず', 'ゔ':'ぶ', 'ゐ':'い', 'ゑ':'え' };
function resolveAlias(m, pv) {
  if (!VB) return null;
  const E = VB.entries;
  const bases = [m.kana]; if (FALLBACK[m.kana]) bases.push(FALLBACK[m.kana]);
  const cands = [];
  for (const b of bases) {
    if (pv === '-') cands.push('- ' + b, '-' + b); else if (pv) cands.push(pv + ' ' + b);
    cands.push(b, toKata(b));
  }
  if (pv && pv !== '-') cands.push(pv + ' ' + m.roma); else if (pv === '-') cands.push('- ' + m.roma);
  cands.push(m.roma);
  for (const c of cands) { if (E.has(c)) return E.get(c); }
  for (const c of cands.slice(0, 3)) { const k = VB.keys.find(x => x.startsWith(c) && x.length <= c.length + 4); if (k) return E.get(k); }
  if (m.kana.length === 2) return resolveAlias(mk({ kana: m.kana[0] }), pv);
  return null;
}
function annotate(plan) {
  let prev = null;
  plan.notes.forEach(nt => {
    if (nt.m.rest) { nt.entry = null; prev = null; return; }
    const pv = (nt.first || !prev) ? '-' : prev.m.vowel;
    const forced = nt.ov && nt.ov.lyric ? nt.ov.lyric.normalize('NFC') : '';
    nt.entry = (forced && VB.entries.get(forced)) || resolveAlias(nt.m, pv);
    prev = nt;
  });
}

async function decodeWav(path) {
  if (VB.audio.has(path)) return VB.audio.get(path);
  const p = (async () => {
    const res = await fetch(VB.base + VB.chunks[path]);
    if (!res.ok) throw new Error('음원 파일을 불러오지 못했어요');
    const buf = await res.arrayBuffer();
    const ab = await new OfflineAudioContext(1, 1, SR).decodeAudioData(buf.slice(0));
    const x = new Float32Array(ab.length);
    for (let c = 0; c < ab.numberOfChannels; c++) { const d = ab.getChannelData(c); for (let i = 0; i < x.length; i++) x[i] += d[i] / ab.numberOfChannels; }
    return x;
  })();
  VB.audio.set(path, p); return p;
}
function estimateF0(x, a, b) {
  const minLag = Math.floor(SR / 900), maxLag = Math.floor(SR / 65), N = 2048;
  const res = [];
  for (let w = 0; w < 3; w++) {
    const start = Math.floor(a + (b - a - N - maxLag) * (0.25 + 0.25 * w));
    if (start < a || start + N + maxLag > b) continue;
    let best = 0, bestLag = 0; const r = new Float32Array(maxLag + 2);
    for (let lag = minLag; lag <= maxLag + 1; lag++) {
      let s = 0, e1 = 0, e2 = 0;
      for (let i = 0; i < N; i += 2) { const p = x[start + i], q = x[start + i + lag]; s += p * q; e1 += p * p; e2 += q * q; }
      r[lag] = s / (Math.sqrt(e1 * e2) + 1e-9);
      if (r[lag] > best) best = r[lag];
    }
    if (best < 0.45) continue;
    for (let lag = minLag + 1; lag <= maxLag; lag++) if (r[lag] >= 0.86 * best && r[lag] >= r[lag-1] && r[lag] >= r[lag+1]) { bestLag = lag; break; }
    if (!bestLag) continue;
    const y0 = r[bestLag-1], y1 = r[bestLag], y2 = r[bestLag+1], den = y0 - 2 * y1 + y2;
    res.push(SR / (bestLag + (den ? 0.5 * (y0 - y2) / den : 0)));
  }
  if (!res.length) return 0;
  res.sort((p, q) => p - q); return res[res.length >> 1];
}
async function getPrep(e) {
  const key = e.path + '|' + e.offset + '|' + e.cutoff;
  if (VB.cache.has(key)) return VB.cache.get(key);
  const x = await decodeWav(e.path);
  const s0 = Math.min(x.length - 1, Math.max(0, Math.round(e.offset / 1000 * SR)));
  let s1 = e.cutoff < 0 ? s0 + Math.round(-e.cutoff / 1000 * SR) : x.length - Math.round(e.cutoff / 1000 * SR);
  s1 = Math.min(x.length, Math.max(s0 + 256, s1));
  const C = Math.min(s1 - s0 - 64, Math.max(0, Math.round(e.consonant / 1000 * SR)));
  let f0 = estimateF0(x, s0 + C, s1); if (!f0) f0 = estimateF0(x, s0, s1); if (!f0) f0 = VB.f0 || 200;
  // 숨소리 섞인 목소리는 한두 옥타브 낮게 잡히기 쉬워서, 음원 전체의 평균 높이에 맞춰 바로잡는다
  if (VB.f0 && (f0 < VB.f0 / 1.8 || f0 > VB.f0 * 1.8)) {
    let best = f0, bd = Infinity;
    for (const k of [1 / 3, 1 / 2, 2, 3]) { const d = Math.abs(Math.log(f0 * k / VB.f0)); if (d < bd) { bd = d; best = f0 * k; } }
    f0 = best;
  }
  const P = SR / f0, marks = [];
  const argmax = (lo, hi) => { lo = Math.max(0, Math.floor(lo)); hi = Math.min(x.length - 1, Math.ceil(hi)); let bi = lo, bv = -Infinity; for (let i = lo; i <= hi; i++) if (x[i] > bv) { bv = x[i]; bi = i; } return bi; };
  // 주기마다 같은 위치에서 자른다: 앞 주기 파형과 가장 닮은 곳을 따라간다 (한 주기에 비슷한 봉우리가 둘이면 엉뚱한 데로 튀어서 소리가 깨짐)
  const H = Math.max(8, Math.round(P / 2));
  const sim = (p, q) => { let s = 0, ea = 0, eb = 0; for (let j = -H; j < H; j += 2) { const u = x[p + j] || 0, v = x[q + j] || 0; s += u * v; ea += u * u; eb += v * v; } return s / (Math.sqrt(ea * eb) + 1e-9); };
  let mpos = argmax(s0 + C, s0 + C + P), per = P;
  const back = [];
  for (let m = mpos, pp = P; m - 0.75 * pp > s0; ) {
    let best = -2, bk = Math.round(m - pp);
    for (let k = Math.round(m - 1.2 * pp); k <= Math.round(m - 0.85 * pp); k++) { const v = sim(m, k); if (v > best) { best = v; bk = k; } }
    if (best < 0.3) bk = Math.round(m - pp); else pp = Math.min(1.25 * P, Math.max(0.8 * P, 0.7 * pp + 0.3 * (m - bk)));
    back.push(bk); m = bk;
  }
  for (let i = back.length - 1; i >= 0; i--) if (back[i] >= s0) marks.push(back[i]);
  while (mpos < s1) {
    marks.push(mpos);
    let best = -2, bk = Math.round(mpos + per);
    for (let k = Math.round(mpos + 0.85 * per); k <= Math.round(mpos + 1.2 * per); k++) { const v = sim(mpos, k); if (v > best) { best = v; bk = k; } }
    if (best < 0.3) bk = Math.round(mpos + per); else per = Math.min(1.25 * P, Math.max(0.8 * P, 0.7 * per + 0.3 * (bk - mpos)));
    mpos = bk;
  }
  let e2 = 0, cnt = 0; for (let i = s0 + C; i < s1; i++) { e2 += x[i] * x[i]; cnt++; }
  const prep = { x, s0, s1, C, P, f0, marks, rms: Math.sqrt(e2 / Math.max(1, cnt)) || 0.05 };
  VB.cache.set(key, prep); return prep;
}
function psola(prep, L, shift, f0fn) {
  const { x, s0, s1, C, P, marks } = prep;
  const out = new Float32Array(L), ws = new Float32Array(L);
  const Pi = Math.max(8, Math.round(P)), win = new Float32Array(2 * Pi + 1);
  for (let j = -Pi; j <= Pi; j++) win[j + Pi] = 0.5 * (1 + Math.cos(Math.PI * j / Pi));
  const srcStart = s0 + shift, Cf = Math.max(0, C - shift);
  const avail = Math.max(Pi, s1 - srcStart - Cf), ratio = L > Cf ? Math.min(1, avail / (L - Cf)) : 1;   // 원음을 빨리 감지 않는다 (빨리 감으면 원음의 흔들림이 떨림이 됨)
  let t = 0;
  while (t < L) {
    let sp = t < Cf ? srcStart + t : srcStart + Cf + (t - Cf) * ratio;
    sp = Math.min(sp, s1 - Pi);
    let lo = 0, hi = marks.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (marks[mid] < sp) lo = mid + 1; else hi = mid; }
    if (lo > 0 && Math.abs(marks[lo - 1] - sp) < Math.abs(marks[lo] - sp)) lo--;
    const mpos = marks[lo], o = Math.round(t);
    for (let j = -Pi; j <= Pi; j++) {
      const oi = o + j, si = mpos + j; if (oi < 0 || oi >= L || si < 0 || si >= x.length) continue;
      const w = win[j + Pi]; out[oi] += x[si] * w; ws[oi] += w;
    }
    t += SR / Math.max(50, f0fn(t));
  }
  for (let i = 0; i < L; i++) out[i] /= Math.max(1, ws[i]);
  return out;
}
async function renderVB(plan, onProgress) {
  const n = Math.ceil(plan.total * SR), out = new Float32Array(n);
  const N = plan.notes;
  // effective preutterance / overlap (UTAU-style auto-fit)
  N.forEach((nt, i) => {
    if (!nt.entry) return;
    let pre = nt.entry.pre / 1000, ovl = nt.entry.ovl / 1000;
    const prev = N[i - 1];
    // 다음 음절이 앞 음절 자리를 너무 많이 빌려 쓰지 않게 (길게 부르는 음이 짧게 끊기는 것 방지)
    const room = prev && prev.entry && !nt.first ? Math.min(prev.d * 0.5, 0.12) : 0.3;
    if (pre - ovl > room && pre > ovl) { const r = room / (pre - ovl); pre *= r; ovl *= r; }
    pre = Math.max(0, Math.min(pre, nt.T));
    nt.pre = pre; nt.ovl = Math.max(0, ovl); nt.start = nt.T - pre; nt.shift = Math.round((nt.entry.pre / 1000 - pre) * SR);
  });
  for (let i = 0; i < N.length; i++) {
    const nt = N[i]; if (!nt.entry) continue;
    const nx = N[i + 1], linked = nx && nx.entry && !nx.first;
    const end = linked ? nx.start + Math.max(nx.ovl, 0.012) : nt.T + nt.d + 0.03;
    const L = Math.max(64, Math.round((end - nt.start) * SR));
    const prep = await getPrep(nt.entry);
    const seg = psola(prep, L, Math.max(0, nt.shift), t => plan.f0At(nt.start + t / SR));
    // 녹음 속 자음(ㅅ, ㅎ 등)이 너무 작으면 모음 크기에 맞춰 살려서, 음과 음 사이가 비어 들리지 않게 한다
    {
      const tA0 = Math.round((nt.T - nt.start) * SR), F = 220;
      let ve = 0, vc = 0; for (let k = tA0; k < Math.min(L, tA0 + Math.round(0.15 * SR)); k++) { ve += seg[k] * seg[k]; vc++; }
      const vlev = vc ? Math.sqrt(ve / vc) : 0, floor = 0.18 * vlev;
      if (vlev > 0.004) {
        const gains = [];
        for (let f = 0; f * F < Math.min(L, tA0); f++) {
          let s2 = 0, zc = 0; const a0 = f * F, a1 = Math.min(L, a0 + F);
          for (let k = a0; k < a1; k++) { s2 += seg[k] * seg[k]; if (k > a0 && (seg[k] >= 0) !== (seg[k - 1] >= 0)) zc++; }
          const r = Math.sqrt(s2 / Math.max(1, a1 - a0)), noisy = zc / Math.max(1, a1 - a0) > 0.2;   // ㅅ·ㅎ 같은 바람 소리만
          gains.push(noisy && r > 0.003 && r < floor ? Math.min(2.5, floor / r) : 1);
        }
        for (let k = 0; k < Math.min(L, tA0); k++) {
          const fp = k / F - 0.5, f0i = Math.max(0, Math.floor(fp)), f1i = Math.min(gains.length - 1, f0i + 1), u = Math.min(1, Math.max(0, fp - f0i));
          seg[k] *= gains[f0i] * (1 - u) + gains[f1i] * u;
        }
      }
    }
    let g = Math.min(8, Math.max(0.15, 0.16 / prep.rms)) * (nt.vol ?? 1);
    if (nt.m.devoice) g *= 0.45;
    const prev = N[i - 1], prevLinked = prev && prev.entry && !nt.first;
    const fin = Math.max(48, Math.round((prevLinked ? Math.max(nt.ovl, 0.012) : 0.006) * SR));
    const fout = Math.max(48, Math.round((linked ? Math.max(nx.ovl, 0.012) : 0.045) * SR));
    const o0 = Math.round(nt.start * SR);
    const tA = Math.round((nt.T - nt.start) * SR), tB = Math.round((nt.T + nt.d - nt.start) * SR);
    const keep = nt.last ? (nt.end === '!' ? 0.9 : nt.end === '?' ? 0.85 : nt.end === ',' ? 0.6 : nt.end === '…' ? 0.2 : nt.m.tilde ? 0.55 : 0.3) : 1;
    for (let k = 0; k < L; k++) {
      let env = 1;
      if (k < fin) env *= 0.5 - 0.5 * Math.cos(Math.PI * k / fin);
      if (k > L - fout) env *= 0.5 - 0.5 * Math.cos(Math.PI * (L - k) / fout);
      if (keep < 1 && k > tA) { const u = Math.min(1, (k - tA) / Math.max(1, tB - tA)); if (u > 0.5) env *= 1 - (1 - keep) * (u - 0.5) / 0.5; }
      const oi = o0 + k; if (oi >= 0 && oi < n) out[oi] += seg[k] * env * g;
    }
    if (onProgress && i % 4 === 0) { onProgress(i / N.length); await new Promise(r => setTimeout(r, 0)); }
  }
  return out;
}

function finish(pcm) {
  let dc = 0, peak = 0;
  for (let i = 0; i < pcm.length; i++) { dc = 0.999 * dc + 0.001 * pcm[i]; pcm[i] -= dc; }
  for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
  const g = peak > 0 ? 0.86 / peak : 1;
  for (let i = 0; i < pcm.length; i++) pcm[i] *= g;
  return pcm;
}
function encodeWav(pcm) {
  const buf = new ArrayBuffer(44 + pcm.length * 2), v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, SR, true); v.setUint32(28, SR * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, pcm[i])) * 32767, true);
  return new Blob([buf], { type: 'audio/wav' });
}
/* ---------------- 금지어 필터 ---------------- */
// 정치·성적·혐오 표현. 띄어쓰기·기호를 빼고, 가타카나는 히라가나로 바꾼 뒤 검사합니다.
// 한글이나 로마자로 쓴 일본어도 가나로 바꾼 읽기로 한 번 더 검사합니다.
const BLOCK = {
  politics: [
    '정치','대통령','국회의원','국회','정당','선거','투표','탄핵','여당','야당','민주당','국민의힘','정의당','조국혁신당','개혁신당',
    '좌파','우파','좌빨','빨갱이','수꼴','일베','종북','친일파','공산당','공산주의','독재','계엄','대선','총선','지방선거',
    '윤석열','이재명','문재인','박근혜','이명박','노무현','김대중','김정은','김정일','김일성','한동훈','트럼프','바이든','시진핑','푸틴','히틀러','나치',
    '政治','選挙','投票','首相','総理','大統領','天皇','自民党','立憲','共産党','維新の会','公明党','安倍','岸田','石破','高市','右翼','左翼',
    'せいじ','せんきょ','とうひょう','しゅしょう','そうりだいじん','だいとうりょう','てんのう','じみんとう','きょうさんとう','こうめいとう','りっけん',
    'あべしんぞう','きしだ','いしば','たかいち','ねとうよ','ぱよく','うよく','さよく','とらんぷ','ばいでん','しゅうきんぺい','ぷーちん','ひとらー','なちす',
  ],
  sexual: [
    '섹스','쎅스','섹쓰','성관계','성교','야동','야한','보지','자지','좆','젖꼭지','발기','자위','오르가즘','콘돔','포르노','음란','강간','성폭행',
    '유두','페니스','질내','떡치','따먹','애무','펠라','씹새','씹년','씹할','섹시','신음','야스','꼴리',
    '性行為','射精','勃起','乳首','強姦','自慰','淫乱',
    'せっくす','えっち','えろい','えろす','えろほん','えろどう','おっぱい','ちんこ','ちんぽ','まんこ','ちくび','おなにー','ぱいずり','ふぇら','なかだし',
    'れいぷ','ごうかん','いんらん','あだると','ぼっき','らぶほ','せいこうい','ぬーど','へんたい',
  ],
  hate: [
    '병신','애자','한남충','김치녀','된장녀','짱깨','쪽바리','깜둥이','흑형','틀딱','급식충','장애인새끼',
    '死ね','きちがい','がいじ','ちょうせんじん','しなじん',
  ],
};
const EN = /\b(sex\w*|porn\w*|nude|naked|fuck\w*|dick|pussy|boobs?|cock|cum|horny|nsfw|hentai|ecchi|oppai|chinko|manko|rape|nigg\w*|fag\w*|retard\w*|politic\w*|election|president|trump|biden|putin|hitler|nazi\w*|democrat\w*|republican\w*|senkyo|seiji|tennou|jimintou)\b/i;
const toHiraAll = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
const compact = s => toHiraAll(s.normalize('NFKC').toLowerCase()).replace(/[^\p{L}\p{N}]/gu, '');
const WORDS = Object.values(BLOCK).flat().map(compact);
function blocked(text) {
  if (EN.test(text.normalize('NFKC'))) return true;
  const a = compact(text);
  const kana = textToPhrases(text).phrases.flatMap(p => p.moras.map(m => m.kana === 'っ' ? 'っ' : m.kana)).join('');
  if (WORDS.some(w => a.includes(w) || kana.includes(w))) return true;
  // 'しね'처럼 짧은 욕은 다른 낱말 속('あたし ねこ')에 섞이기 쉬워서, 따로 떨어진 낱말일 때만 막습니다
  const words = toHiraAll(text.normalize('NFKC')).split(/[^\p{L}\p{N}ー]+/u);
  return words.some(w => /^(しね|しねよ|しねや|しんで|しんじまえ)[ーぇっ]*$/.test(w));
}

/* ---------------- 음원 불러오기 ---------------- */
async function loadVoice(c) {
  const base = c.voice.endsWith('/') ? c.voice : c.voice + '/';
  const res = await fetch(base + 'oto.json');
  if (!res.ok) throw new Error('음원 목록을 불러오지 못했어요');
  const d = await res.json();
  const entries = new Map();
  for (const [alias, path, offset, consonant, cutoff, pre, ovl] of d.e) {
    const k = alias.normalize('NFC');
    if (!entries.has(k)) entries.set(k, { alias: k, path, offset, consonant, cutoff, pre, ovl });
  }
  return { id: c.id, name: c.name, base, f0: d.f0 || 0, chunks: d.chunks, entries, keys: [...entries.keys()], cache: new Map(), audio: new Map() };
}

/* ---------------- 화면 ---------------- */
// 버전이 있는 캐릭터(예: 키 기본/위스퍼)는 버전마다 따로 고를 수 있게 펼친다
const characters = window.SITE.characters.flatMap(c => !c.versions ? [c] : c.versions.map((v, i) => ({
  ...c, ...v, id: i ? `${c.id}-${v.id}` : c.id, name: i ? (v.talkName || `${c.name} ${v.label}`) : c.name,
  thumb: v.thumb || (v.image && i ? v.image : c.thumb), voice: v.voice || (i ? '' : c.voice),
})).filter((v, i) => i === 0 || v.voice));
const esc = v => String(v).replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`);
const LINES = {
  chansa: ['안녕하세요, 찬사에요.', 'かんぱーーーい!!!', 'マスタァー!!! こんにちは!', 'あたし ネコだにゃ!'],
  'chansa-cv': ['안녕하세요, 찬사에요.', 'かんぱーーーい!!!', 'マスタァー!!! こんにちは!', 'あたし ネコだにゃ!'],
  'ryookoro-ki': ['오늘은 코러스 누구로 할까?', '아하하하하!', 'びっくりした?', 'にげちゃだめだよ〜'],
  'ryookoro-ki-whisper': ['비밀이야~', '노래를 불러보자.', 'しずかに…ね?', 'わからないほうがいいよ.'],
  kapshong: ['나는 카프숑이다.', '자비를 베풀겠노라!', 'わたしが かみだ!'],
  bellein: ['나다, 벨레인!', '진짜 제가 불러요?', 'プロデューサーに なりたかったのに!', 'うまくやりたい…'],
  nanaba: ['안녕하세요! 나나바예요.', '같이 노래해요!', 'よろしくね!'],
  'chansa-kid': ['안녕! 나 찬사야!', '치즈 주세요!', 'いっしょに あそぼ!'],
  sereni: ['안녕하세요, 세레니예요!', '어라? 뭐 하려고 했더라...', 'がんばって うたうね!'],
};
const DEFAULT_LINES = ['안녕하세요!', 'こんにちは! よろしくね!'];
let current = characters.find(c => c.voice) || null;

root.innerHTML = `
  <div class="talk-head">
    <h1>말 시키기</h1>
    <span class="mono">UTAU TTS · 한글 · 가나 · 로마자</span>
  </div>
  <p class="talk-lead">야르르UTAU 아이들의 원래 음원으로 짧은 대사를 읽어 줘요. 한자는 읽지 못하니 가나로 써 주세요.</p>

  <h2 class="talk-step"><span class="mono">01</span>누구에게 시킬까요?</h2>
  <div class="who" role="radiogroup" aria-label="캐릭터">
    ${characters.map(c => {
      const ok = !!c.voice;
      return `<button type="button" class="who-btn" role="radio" data-id="${esc(c.id)}" aria-checked="${current && c.id === current.id}" ${ok ? '' : 'disabled'}
        style="--c:${c.color};--i:${c.soon ? '#000' : c.ink}">
        <span class="who-face">${c.thumb ? `<img src="${esc(c.thumb)}" style="object-position:${c.focus || '50%'} top" alt="">` : '<span>?</span>'}</span>
        <span class="who-name">${esc(c.soon ? '준비 중' : c.name)}</span>
        <small>${ok ? '말할 수 있어요' : c.soon ? 'Coming soon' : '음원 준비 중'}</small>
      </button>`;
    }).join('')}
  </div>

  <h2 class="talk-step"><span class="mono">02</span>대사</h2>
  <div class="talk-box">
    <label class="sr-only" for="talk-text">대사</label>
    <textarea id="talk-text" maxlength="120" rows="3" placeholder="여기에 대사를 써 주세요 (120자까지)"></textarea>
    <div class="talk-examples" id="talk-examples"></div>
  </div>

  <h2 class="talk-step"><span class="mono">03</span>목소리 다듬기</h2>
  <div class="knobs">
    <label class="knob"><span>높이 <output id="o-base"></output></span><input type="range" id="k-base" min="90" max="600" step="1" value="330"></label>
    <label class="knob"><span>빠르기 <output id="o-rate"></output></span><input type="range" id="k-rate" min="4" max="11" step="0.1" value="7"></label>
    <label class="knob"><span>억양 <output id="o-range"></output></span><input type="range" id="k-range" min="0" max="2" step="0.05" value="0.8"></label>
  </div>

  <div class="talk-actions">
    <button type="button" class="talk-go" id="talk-go">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v18l15-9z"/></svg>말하기
    </button>
    <button type="button" class="talk-sub" id="talk-stop">멈추기</button>
    <button type="button" class="talk-sub" id="talk-save">wav 저장</button>
  </div>
  <p class="talk-status" id="talk-status" role="status" aria-live="polite"></p>
  <audio id="talk-audio" hidden></audio>

  <p class="talk-rule">정치적·성적·혐오 표현은 만들 수 없어요. 만든 목소리도 각 음원의 사용 규약을 지켜 주세요.</p>`;

const $ = id => document.getElementById(id);
const txt = $('talk-text'), status = $('talk-status'), audio = $('talk-audio');
const setStatus = (msg, warn) => { status.textContent = msg; status.classList.toggle('warn', !!warn); };
let baseTouched = false, busy = false, lastPcm = null, urlObj = null, downloads = null;

function syncKnobs() {
  $('o-base').textContent = `${$('k-base').value}Hz`;
  $('o-rate').textContent = `${(+$('k-rate').value).toFixed(1)}`;
  $('o-range').textContent = `${Math.round($('k-range').value * 100)}%`;
}
['k-base', 'k-rate', 'k-range'].forEach(id => $(id).addEventListener('input', () => { if (id === 'k-base') baseTouched = true; syncKnobs(); }));

function showExamples() {
  const box = $('talk-examples');
  box.innerHTML = '';
  (LINES[current?.id] || DEFAULT_LINES).forEach(line => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'talk-chip'; b.textContent = line;
    b.addEventListener('click', () => { txt.value = line; txt.focus(); });
    box.appendChild(b);
  });
}

async function pick(c) {
  current = c;
  document.querySelectorAll('.who-btn').forEach(b => b.setAttribute('aria-checked', b.dataset.id === c.id));
  root.style.setProperty('--talk', c.color);
  root.style.setProperty('--talk-ink', c.ink);
  showExamples();
  if (VB?.id === c.id) return;
  VB = null;
  setStatus(`${c.name} 목소리를 불러오는 중…`);
  try {
    const vb = await loadVoice(c);
    if (current !== c) return;
    VB = vb;
    const ref = vb.entries.get('- あ') || vb.entries.get('a あ') || vb.entries.get('あ');
    if (ref && !baseTouched) {
      const prep = await getPrep(ref);
      if (prep.f0 > 80 && prep.f0 < 700) { $('k-base').value = Math.round(prep.f0); syncKnobs(); }
    }
    setStatus(`${c.name} 준비 완료! 대사를 쓰고 말하기를 눌러 주세요.`);
  } catch (e) {
    console.error(e);
    setStatus(`목소리를 불러오지 못했어요: ${e.message}`, true);
  }
}
document.querySelectorAll('.who-btn').forEach(b => b.addEventListener('click', () => {
  const c = characters.find(x => x.id === b.dataset.id);
  if (c?.voice) pick(c);
}));

$('talk-go').addEventListener('click', async () => {
  if (busy) return;
  const text = txt.value.trim();
  if (!text) { setStatus('대사를 먼저 써 주세요.', true); txt.focus(); return; }
  if (blocked(text)) { setStatus('이 대사는 만들 수 없어요. 정치적·성적·혐오 표현은 막혀 있어요.', true); return; }
  if (!VB) { setStatus('목소리를 아직 불러오는 중이에요. 잠시 후 다시 눌러 주세요.', true); return; }
  busy = true; $('talk-go').disabled = true;
  try {
    const plan = makePlan({ text, base: +$('k-base').value, rate: +$('k-rate').value, range: +$('k-range').value,
      wob: 0.3, langSel: 'auto', breath: 0.6, gap: 110 });
    if (!plan.notes.some(n => !n.m.rest)) { setStatus('읽을 수 있는 글자가 없어요. 한글, 가나, 로마자로 써 주세요.', true); return; }
    annotate(plan);
    setStatus('목소리를 만드는 중…');
    const pcm = finish(await renderVB(plan, p => setStatus(`목소리를 만드는 중… ${Math.round(p * 100)}%`)));
    lastPcm = pcm;
    if (urlObj) URL.revokeObjectURL(urlObj);
    urlObj = URL.createObjectURL(encodeWav(pcm));
    audio.src = urlObj;
    await audio.play().catch(() => {});
    const msgs = [`${VB.name}(이)가 말하는 중`];
    if (plan.skipped.length) msgs.push(`한자(${plan.skipped.slice(0, 4).join('')})는 건너뛰었어요.`);
    setStatus(msgs.join(' · '));
    $('talk-save').disabled = false;
  } catch (e) {
    console.error(e);
    setStatus(`소리를 만들지 못했어요: ${e.message}`, true);
  } finally { busy = false; $('talk-go').disabled = false; }
});
$('talk-stop').addEventListener('click', () => { audio.pause(); audio.currentTime = 0; });

$('talk-save').addEventListener('click', async () => {
  if (!lastPcm) { setStatus('먼저 말하기를 눌러 소리를 만들어 주세요.', true); return; }
  const filename = `${VB.name}_말하기.wav`;
  if (!downloads) {
    // 일반 웹페이지: 브라우저 다운로드로 바로 저장
    const a = document.createElement('a');
    a.href = URL.createObjectURL(encodeWav(lastPcm)); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    setStatus('저장했어요.'); return;
  }
  try { await downloads.save({ filename, data: encodeWav(lastPcm) }); setStatus('저장했어요.'); }
  catch (e) { setStatus(e?.code === 'declined' ? '저장을 취소했어요.' : '이 화면에서는 저장할 수 없어요.', e?.code !== 'declined'); }
});
(async () => {
  for (let i = 0; i < 20 && !(window.claude && window.claude.use); i++) await new Promise(r => setTimeout(r, 150));
  try { downloads = window.claude?.use ? await window.claude.use('downloads') : null; } catch (e) { downloads = null; }
  $('talk-save').hidden = false;
})();

syncKnobs();
showExamples();
if (current) pick(current);
else setStatus('아직 말할 수 있는 아이가 없어요.', true);
})();
