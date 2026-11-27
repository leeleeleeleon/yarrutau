(() => {
  const { characters, songs, contact, news = [], otoCredit = '' } = window.SITE;
  const page = document.body.dataset.page;
  const character = characters.find((c) => c.id === page);
  const KIND = { VCV: '연속음', CV: '단독음' };
  let current; // 선택한 버전까지 합쳐진 현재 캐릭터
  let stopPlayer = () => {};

  const esc = (value) => String(value).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
  const safeUrl = (value) => (/^https?:\/\//i.test(value) ? esc(value) : '');
  // 다운로드는 외부 링크(https://)와 사이트 안 파일(assets/) 둘 다 가능
  const fileUrl = (value) => (/^(assets\/|\/_blob\/[\w-]+$)/.test(value) ? esc(value) : safeUrl(value));
  const youtubeId = (url) =>
    url?.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/)?.[1];
  const time = (sec) => {
    const s = Number.isFinite(sec) ? Math.floor(sec) : 0;
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  const num = (i) => String(i + 1).padStart(2, '0');
  const langOf = (text) => (/[^\x00-\x7F]/.test(text) ? 'ja' : 'en');
  const themeOf = (c) =>
    `--bg:${c.color};--ink:${c.ink};--accent:${c.accent};--on-accent:${c.onAccent}`;
  // 버전이 있는 캐릭터는 모든 버전의 음원을 함께 보여 준다 (기본 + 위스퍼 등)
  const allDownloads = (c) => {
    const base = characters.find((x) => x.id === c.id) || c;
    if (!base.versions) return base.downloads || [];
    return base.versions.flatMap((v, i) => (v.downloads || (i === 0 ? base.downloads : null) || [])
      .map((d) => ({ ...d, ver: v.label })));
  };

  // 상단 피아노롤: 우타우 편집 화면처럼 마디, 건반, 노트, 피치선
  const ROLL = { top: 28, row: 20, width: 1440, height: 240 };
  const MELODY = [
    [6, 80, 80, '야'], [4, 160, 40, '르'], [5, 200, 80, '르'], [2, 280, 120, '우'],
    [3, 400, 40, '타'], [5, 440, 80, '우'], [7, 520, 120, '노'], [4, 640, 160, '래'],
    [3, 840, 80, '하'], [1, 920, 40, '자'], [2, 960, 120, '라'], [4, 1080, 80, '라'],
    [6, 1160, 40, '라'], [5, 1200, 120, '라'], [7, 1320, 120, '아'],
  ];
  const BLACK_ROWS = [1, 3, 6, 8];

  function pianoRoll() {
    const { top, row, width, height } = ROLL;
    const out = [];
    const cy = (r) => top + r * row + row / 2;

    BLACK_ROWS.forEach((i) => out.push(`<rect x="0" y="${top + i * row}" width="${width}" height="${row}" fill="#f4f4f7"/>`));
    for (let x = 56; x < width; x += 40) {
      out.push(`<rect x="${x}" y="${top}" width="1" height="${height - top}" fill="${(x - 56) % 160 ? '#ebebf0' : '#d4d4dc'}"/>`);
    }
    for (let i = 0; i < 12; i += 1) out.push(`<rect x="0" y="${top + i * row}" width="${width}" height="1" fill="#ebebf0"/>`);

    out.push(`<rect x="0" y="0" width="${width}" height="${top}" fill="#fff"/><rect x="0" y="${top - 1}" width="${width}" height="1" fill="#000"/>`);
    for (let x = 56, bar = 1; x < width; x += 160, bar += 1) {
      out.push(`<rect x="${x}" y="14" width="1" height="${top - 14}" fill="#000"/>
        <text x="${x + 5}" y="22" class="roll-num">${bar}</text>`);
      [40, 80, 120].forEach((k) => out.push(`<rect x="${x + k}" y="21" width="1" height="${top - 21}" fill="#000"/>`));
    }

    out.push(`<rect x="0" y="${top}" width="56" height="${height - top}" fill="#fff"/><rect x="55" y="${top}" width="1" height="${height - top}" fill="#000"/>`);
    for (let i = 0; i < 11; i += 1) {
      const y = top + i * row;
      out.push(`<rect x="0" y="${y}" width="56" height="1" fill="#c9c9d1"/>`);
      if (BLACK_ROWS.includes(i)) out.push(`<rect x="0" y="${y + 2}" width="34" height="${row - 4}" rx="2" fill="#000"/>`);
    }
    out.push(`<text x="38" y="${top + 9 * row + 14}" class="roll-num" font-size="9">C4</text>`);

    const path = [];
    const points = [];
    MELODY.forEach(([r, x, len], j) => {
      const y = cy(r);
      if (j === 0) path.push(`M${x} ${y}`);
      else {
        path.push(`C${x - 6} ${cy(MELODY[j - 1][0])} ${x - 6} ${y} ${x + 12} ${y}`);
        points.push([x + 12, y]);
      }
      if (len >= 120) path.push(`H${x + len - 56} q3.5 -5 7 0 t7 0 q3.5 -5 7 0 t7 0 q3.5 -5 7 0 t7 0`);
      path.push(`H${x + len - 14}`);
    });

    MELODY.forEach(([r, x, len, lyric], j) => {
      const c = characters[j % characters.length];
      const on = !current || current.id === c.id;
      const fill = on ? (current?.id === c.id ? current.color : c.color) : '#e7e7ea';
      const ink = on ? (current?.id === c.id ? current.ink : c.ink) : '#77777f';
      const y = top + r * row;
      out.push(`<g class="note" data-note="${c.id}">
        <rect x="${x + 1}" y="${y + 2}" width="${len - 2}" height="${row - 4}" rx="3" fill="${fill}" stroke="#000" stroke-width="1.5"/>
        <text x="${x + 8}" y="${y + 15}" class="roll-lyric" fill="${ink}">${lyric}</text></g>`);
    });
    out.push(`<path d="${path.join(' ')}" fill="none" stroke="#3a3a44" stroke-width="1.5" stroke-linecap="round"/>`);
    points.forEach(([x, y]) => out.push(`<circle cx="${x}" cy="${y}" r="3" fill="#fff" stroke="#3a3a44" stroke-width="1.5"/>`));
    out.push(`<rect x="1104" y="0" width="2" height="${height}" fill="#fc1260"/><path d="M1097 0 H1113 L1105 10 Z" fill="#fc1260"/>`);

    return `<svg class="roll" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${out.join('')}</svg>`;
  }

  function header() {
    const tabs = characters.map((c, i) => c.soon ? `
      <span class="tab is-soon" data-id="${c.id}" style="${themeOf(c)}">
        <span class="tab-num">${num(i)} · COMING SOON</span>
        <span class="tab-name">준비 중</span>
      </span>` : `
      <a class="tab" href="${c.id}.html" data-id="${c.id}" style="${themeOf(current?.id === c.id ? current : c)}"
        ${c.id === current?.id ? 'aria-current="page"' : ''}>
        <span class="tab-num">${num(i)}${c.en ? ` · ${esc(c.en)}` : ''}</span>
        <span class="tab-name">${esc(c.name)}</span>
      </a>`).join('');
    const talkBar = page === 'talk' ? '' : `
      <a class="talk-bar" href="talk.html">
        <span class="mono">NEW · TTS</span>
        <span class="talk-bar-text">우리 애들한테 말 시키기</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </a>`;

    return `
      <header class="masthead">
        ${pianoRoll()}
        <a class="brand" href="index.html">
          <img src="assets/img/logo.webp" width="386" height="400" alt="야르르UTAU 홈">
        </a>
      </header>
      <nav class="tabs" aria-label="캐릭터">${tabs}</nav>${talkBar}`;
  }

  function footer() {
    const items = [];
    if (contact.email) items.push(`<a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>`);
    contact.links.forEach(({ label, url }) => {
      if (safeUrl(url)) items.push(`<a href="${safeUrl(url)}" target="_blank" rel="noopener">${esc(label)}</a>`);
    });
    return `
      <footer class="footer">
        ${current ? '' : `<div class="footer-mark"><img src="assets/img/logo.webp" alt=""><span>YARRUTAU OFFICIAL</span></div>`}
        <div class="contact"><h2>연락</h2>${items.join('') || '<p>연락처 준비 중</p>'}</div>
        ${otoCredit ? `<p class="credit">원음설정(oto) · ${esc(otoCredit)}</p>` : ''}
      </footer>`;
  }

  function chip(c, { type, url, size, parts, ver }) {
    url = url || parts?.[0]?.url;
    const inner = `${esc(type)}${ver ? ` ${esc(ver)}` : ''}<small>${url ? esc(size || '') : '준비 중'}</small>`;
    return url
      ? `<span class="chip" style="background:${c.color};color:${c.ink}">${inner}</span>`
      : `<span class="chip is-empty">${inner}</span>`;
  }

  function home() {
    const cast = characters.map((c) => c.soon ? `<div class="cast-soon" style="background:${c.color}"><span>?</span></div>` : `
      <div style="background:${c.color}">
        ${c.image ? `<img src="${esc(c.thumb || c.image)}" style="object-position:${c.focus || '50%'} top" alt="">` : ''}
      </div>`).join('');
    const lanes = characters.map((c) =>
      `<span style="border-color:${c.color === '#000000' ? '#000' : c.color}">${esc(c.soon ? 'SOON' : (c.en || c.name).toUpperCase())}</span>`).join('');

    const voicebanks = characters.map((c) => {
      if (c.soon) return `
        <div class="vb is-soon">
          <div class="vb-thumb" style="background:${c.color}"><span>?</span></div>
          <div class="vb-name"><p class="vb-title">준비 중</p><p class="vb-sub">새 친구가 곧 올라와요</p></div>
          <div class="vb-chips"><span class="chip is-empty">준비 중</span></div>
        </div>`;
      const notes = [c.subname, c.versions?.map((v) => v.label).join(' / ')]
        .filter(Boolean).join(' · ');
      const downloads = allDownloads(c);
      return `
        <a class="vb" href="${c.id}.html">
          <div class="vb-thumb" style="background:${c.color}">
            ${c.image ? `<img src="${esc(c.thumb || c.image)}" style="object-position:${c.focus || '50%'} top" alt="">` : ''}
          </div>
          <div class="vb-name">
            <p class="vb-title">${esc(c.name)}</p>
            <p class="vb-sub" lang="${langOf(notes)}">${esc(notes)}</p>
          </div>
          <div class="vb-chips">${downloads.map((d) => chip(c, d)).join('') || '<span class="chip is-empty">준비 중</span>'}</div>
        </a>`;
    }).join('');

    return `
      <main class="home">
        <h1 class="sr-only">야르르UTAU 공식 홈페이지</h1>
        <div class="home-top">
          <section class="screen-wrap" aria-label="영상">
            <div class="screen" id="screen">
              <div class="screen-empty"><div class="cast">${cast}</div><p><span class="dot"></span>첫 영상 준비 중</p></div>
            </div>
            <div class="lanes" aria-hidden="true" style="--n:${characters.length}">${lanes}</div>
          </section>
          <section class="songs" aria-labelledby="songs-title">
            <div class="songs-head">
              <h2 id="songs-title">곡</h2>
              <span class="mono">TRACK ${String(songs.length).padStart(2, '0')}</span>
            </div>
            <div class="filters" role="group" aria-label="곡 종류">
              ${['전체', '오리지널', '커버'].map((type, i) =>
                `<button type="button" data-filter="${type}" aria-pressed="${i === 0}">${type}</button>`).join('')}
            </div>
            <ul class="song-list" id="song-list"></ul>
          </section>
        </div>
        ${news.length ? `<section class="news" aria-labelledby="news-title">
          <div class="section-head">
            <h2 id="news-title">소식</h2>
            <span class="mono">NEWS</span>
          </div>
          <ul class="news-list">${news.map((x) => `<li><time class="mono">${esc(x.date)}</time><span>${esc(x.text)}</span></li>`).join('')}</ul>
        </section>` : ''}
        <section class="range-chart" aria-labelledby="range-title">
          <div class="section-head">
            <h2 id="range-title">음역 비교</h2>
            <span class="mono">RANGE</span>
          </div>
          <a href="assets/img/range.png" target="_blank" rel="noopener"><img src="assets/img/range.webp" width="1800" height="1320" loading="lazy" alt="야르르UTAU 음원 9개의 추천 음역과 원음 음높이를 피아노 건반 위에 비교한 그래프"></a>
        </section>
        <section class="voicebanks" aria-labelledby="vb-title">
          <div class="section-head">
            <h2 id="vb-title">음원 배포</h2>
            <span class="mono">VCV 연속음 · CV 단독음 · CVVC</span>
          </div>
          ${voicebanks}
        </section>
      </main>`;
  }

  function startHome() {
    const screen = document.querySelector('#screen');
    const list = document.querySelector('#song-list');
    let filter = '전체';
    let selected = songs[0];

    function showVideo(autoplay) {
      const id = youtubeId(selected?.youtube);
      if (!id) return;
      screen.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}${autoplay ? '?autoplay=1' : ''}"
        title="${esc(selected.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    }

    function showList() {
      const shown = songs.filter((s) => filter === '전체' || s.type === filter);
      list.innerHTML = shown.map((s) => {
        const who = (s.singers || [])
          .map((id) => characters.find((c) => c.id === id)?.name).filter(Boolean).join(', ');
        return `<li><button type="button" class="song" data-index="${songs.indexOf(s)}" aria-pressed="${s === selected}">
          <span class="song-title">${esc(s.title)}</span><span class="song-type">${esc(s.type)}</span>
          <span class="song-who">${esc(who)}${s.credit ? ` / ${esc(s.credit)}` : ''}</span>
        </button></li>`;
      }).join('') || `<li class="song-empty">
          <svg viewBox="0 0 200 40" aria-hidden="true"><rect x="0" y="22" width="44" height="12" rx="2"/><rect x="54" y="6" width="36" height="12" rx="2"/><rect x="100" y="14" width="50" height="12" rx="2"/><rect x="160" y="22" width="40" height="12" rx="2"/></svg>
          <p class="song-empty-title">${filter === '전체' ? '' : `${filter} `}곡이 곧 올라와요.</p>
          <p>오리지널과 커버가 올라오면 여기에서 바로 재생할 수 있어요.</p>
        </li>`;
    }

    document.querySelector('.filters').addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      filter = button.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', b === button));
      showList();
    });

    list.addEventListener('click', (event) => {
      const button = event.target.closest('.song');
      if (!button) return;
      const { index } = button.dataset;
      selected = songs[index];
      showVideo(true);
      showList();
      list.querySelector(`[data-index="${index}"]`)?.focus({ preventScroll: true });
    });

    showVideo(false);
    showList();
  }

  // 샘플 플레이어의 파형 (모양만, 실제 소리와는 무관)
  const WAVE = [4, 8, 14, 10, 18, 12, 6, 16, 10, 14, 8, 12, 18, 10, 6, 14, 16, 8, 12, 4, 10, 18, 14, 8, 12, 6, 16,
    10, 14, 8, 4, 12, 16, 18, 10, 6, 14, 8, 12, 16, 10, 4, 14, 18, 8, 12, 6, 10, 16, 14, 8, 12, 4, 2];
  function wave() {
    const bars = WAVE.map((h, i) => `<rect x="${i * 8}" y="${20 - h}" width="4" height="${h * 2}"/>`).join('');
    const w = WAVE.length * 8 - 4;
    return `<svg viewBox="0 0 ${w} 40" preserveAspectRatio="none" aria-hidden="true">${bars}</svg>`;
  }

  // 음원 정보 표: 형식은 이 버전의 다운로드에서, 음높이는 원음을 측정한 값
  function profileTable(c) {
    const own = c.versions ? allDownloads(c).filter((d) => d.ver === c.versionLabel) : allDownloads(c);
    const types = [...new Set(own.map((d) => d.type))]
      .map((t) => `${t}${KIND[t] ? ` (${KIND[t]})` : ''}`).join(' · ');
    const rows = [
      ['음원 형식', types],
      ['원음 음높이', c.pitch],
      ['추천 음역', c.range],
      ['CV', c.cv],
      ['원음설정', 'oto' in c ? c.oto : otoCredit],
      ['일러스트', c.illust],
    ].filter(([, v]) => v);
    return `<dl class="spec">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd lang="${/[぀-ヿ]/.test(v) ? 'ja' : 'ko'}">${esc(v)}</dd></div>`).join('')}</dl>
          <p class="spec-note">추천 음역은 원음 음높이를 측정해 잡은 참고값이에요. 곡에 따라 더 넓게 써도 괜찮아요.</p>`;
  }

  // 사용 규약: 음원 주인이 정한 내용. 없으면 문의 안내
  const TERM = { ok: '가능', no: '불가', ask: '문의', part: '조건부' };
  function termsTable(c) {
    if (!c.terms?.length) {
      return `<p class="terms-empty">사용 규약을 정리하고 있어요. 이용하기 전에 ${contact.email ? `<a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>로 ` : ''}문의해 주세요.</p>`;
    }
    return `<ul class="terms">${c.terms.map(([item, state, text]) => `
      <li><span class="terms-item">${esc(item)}</span>${TERM[state] ? `<span class="terms-state is-${esc(state)}">${TERM[state]}</span>` : ''}${text && text !== TERM[state] ? `<span class="terms-text">${esc(text)}</span>` : ''}</li>`).join('')}
    </ul>`;
  }

  function profile(c) {
    const art = c.image
      ? `<img class="art" src="${esc(c.image)}" alt="${esc(c.name)} ${esc(c.versionLabel || '')} 스탠딩">`
      : '<div class="art-empty">스탠딩 준비 중</div>';
    const bgWord = c.bgText || c.name;

    const switcher = c.versions ? `
      <div class="versions" role="group" aria-label="버전">
        ${c.versions.map((v) => `<button type="button" data-version="${esc(v.id)}"
          aria-pressed="${v.id === c.versionId}">${esc(v.label)}</button>`).join('')}
      </div>` : '';

    const one = ({ type, url, size, file }, label) => {
      const name = `<span class="download-type">${esc(type)}${label ? `<small>${esc(label)}</small>` : KIND[type] ? `<small>${KIND[type]}</small>` : ''}</span>`;
      const href = fileUrl(url);
      const external = Boolean(safeUrl(url));
      const target = external ? 'target="_blank" rel="noopener"' : `download="${esc(file || '')}"`;
      const icon = external ? '<path d="M7 17L17 7M9 7h8v8"/>' : '<path d="M12 3v13M6 10l6 6 6-6M4 21h16"/>';
      return href
        ? `<a class="download" href="${href}" ${target}>${name}<span class="download-size">${size ? esc(size) : '다운로드'}<svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg></span></a>`
        : `<span class="download is-empty">${name}<small>준비 중</small></span>`;
    };
    // 용량이 커서 나눈 음원: 조각을 모두 받아 같은 곳에 풀면 한 폴더로 합쳐집니다
    const list = allDownloads(c);
    const downloads = list.map((d) => d.parts?.length
      ? `<div class="download-set">
          <p class="download-note">${d.ver ? `${esc(d.ver)} · ` : ''}${esc(d.type)} ${KIND[d.type] || ''} · ${d.size ? `${esc(d.size)} · ` : ''}${d.parts.length}개로 나눠 두었어요. 모두 받아서 같은 곳에 압축을 풀면 한 폴더로 합쳐져요.</p>
          <div class="download-parts">${d.parts.map((p, i) => one({ type: d.type, url: p.url, size: p.size, file: p.file }, `${i + 1}/${d.parts.length}`)).join('')}</div>
        </div>`
      : one(d, d.ver ? (d.ver === KIND[d.type] ? d.ver : `${d.ver} · ${KIND[d.type] || ''}`) : '')).join('');

    let n = 0;
    const heading = (text) => `<h2><span class="mono">${num(n++)}</span>${text}</h2>`;

    return `
      <main class="profile">
        <div class="standing">
          <div class="standing-art">
            <p class="bg-word" lang="${/[぀-ヿ一-鿿]/.test(bgWord) ? 'ja' : 'ko'}" style="--n:${[...bgWord].length}" aria-hidden="true">${esc(bgWord)}</p>
            ${art}
          </div>
          <p class="hashtag">#${esc(c.hashtag)}</p>
        </div>
        <div class="info">
          ${c.logo ? `<img class="info-logo${c.logoBg ? ' on-plate' : ''}" src="${esc(c.logo)}" ${c.logoBg ? `style="background:${esc(c.logoBg)}"` : ''} alt="">` : ''}
          <h1 class="${c.logo ? 'with-logo' : ''}">${esc(c.name)}</h1>
          <div class="meta">
            ${c.subname ? `<p class="subname" lang="${langOf(c.subname)}">${esc(c.subname)}</p>` : ''}
            ${c.cv ? `<span class="tag">CV. ${esc(c.cv)}</span>` : ''}
          </div>
          ${c.illust ? `<p class="credits">그림. ${esc(c.illust)}</p>` : ''}
          ${switcher}

          ${heading('샘플 재생')}
          <div class="player${c.sample ? '' : ' is-empty'}">
            <button class="play" type="button" aria-label="샘플 재생" ${c.sample ? '' : 'disabled'}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v18l15-9z"/></svg>
            </button>
            <div class="wave">
              ${c.sample ? `<div class="wave-rest">${wave()}</div><div class="wave-done">${wave()}</div>` : '<span class="wave-line"></span>'}
              <input class="seek" type="range" min="0" max="100" step="0.1" value="0" aria-label="재생 위치" disabled>
            </div>
            <span class="time">${c.sample ? '0:00 / 0:00' : '준비 중'}</span>
          </div>

          ${heading('설명')}
          <p class="description">${esc(c.description || '소개가 곧 올라와요.')}</p>
          ${c.descriptionEn ? `<p class="description" lang="en">${esc(c.descriptionEn)}</p>` : ''}
          ${c.descriptionJa ? `<p class="description" lang="ja">${esc(c.descriptionJa)}</p>` : ''}

          ${heading('프로필')}
          ${profileTable(c)}

          ${heading('사용 규약')}
          ${termsTable(c)}

          ${downloads ? `${heading('음원 다운로드')}
          <div class="downloads">${downloads}</div>` : ''}
        </div>
      </main>`;
  }

  function startPlayer(c) {
    if (!c.sample) return () => {};
    const player = document.querySelector('.player');
    const play = document.querySelector('.play');
    const icon = play.querySelector('path');
    const seek = document.querySelector('.seek');
    const label = document.querySelector('.time');
    const audio = new Audio();

    const update = () => {
      seek.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      player.style.setProperty('--progress', `${seek.value}%`);
      label.textContent = `${time(audio.currentTime)} / ${time(audio.duration)}`;
    };
    const setPlaying = (on) => {
      play.setAttribute('aria-label', on ? '일시정지' : '샘플 재생');
      icon.setAttribute('d', on ? 'M5 3h5v18H5zM14 3h5v18h-5z' : 'M6 3v18l15-9z');
    };

    audio.addEventListener('loadedmetadata', () => { seek.disabled = false; update(); });
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('play', () => setPlaying(true));
    audio.addEventListener('pause', () => setPlaying(false));
    audio.addEventListener('error', () => {
      play.disabled = true;
      seek.disabled = true;
      label.textContent = '파일을 불러올 수 없어요';
    });
    play.addEventListener('click', () => {
      // 재생 실패 안내는 error 이벤트에서 처리한다
      if (audio.paused) audio.play().catch(() => setPlaying(false));
      else audio.pause();
    });
    seek.addEventListener('input', () => {
      audio.currentTime = (seek.value / 100) * audio.duration;
      update();
    });
    audio.preload = 'metadata';
    audio.src = c.sample;
    return () => audio.pause();
  }

  function withVersion(c) {
    if (!c?.versions) return c;
    const version = c.versions.find((v) => `#${v.id}` === location.hash) || c.versions[0];
    return { ...c, ...version, id: c.id, versionId: version.id, versionLabel: version.label };
  }

  // 탭에 올리면 그 캐릭터의 노트가 튀어오른다
  function startTabs() {
    document.querySelectorAll('.tab').forEach((tab) => {
      const lift = (on) => document.querySelectorAll(`[data-note="${tab.dataset.id}"]`)
        .forEach((note) => note.classList.toggle('lift', on));
      ['pointerenter', 'focus'].forEach((name) => tab.addEventListener(name, () => lift(true)));
      ['pointerleave', 'blur'].forEach((name) => tab.addEventListener(name, () => lift(false)));
    });
  }

  function render() {
    stopPlayer();
    current = withVersion(character);
    if (current) document.body.style.cssText = themeOf(current);
    const main = page === 'talk' ? '<main class="talk" id="talk-root"></main>' : current ? profile(current) : home();
    document.querySelector('#app').innerHTML = header() + main + footer();
    startTabs();

    if (page === 'talk') return;
    if (!current) {
      startHome();
      return;
    }
    stopPlayer = startPlayer(current);
    document.querySelectorAll('[data-version]').forEach((button) => {
      button.addEventListener('click', () => {
        const { version } = button.dataset;
        history.replaceState(null, '', `#${version}`);
        render();
        document.querySelector(`[data-version="${version}"]`).focus({ preventScroll: true });
      });
    });
  }

  render();
  if (character?.versions) window.addEventListener('hashchange', render);
})();
