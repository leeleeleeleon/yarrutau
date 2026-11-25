/*
  사이트 내용은 이 파일만 고치면 됩니다.
  빈칸('')으로 두면 사이트에는 "준비 중"으로 나옵니다.
  단, illust(그림 작가)는 빈칸이면 줄 자체가 안 나옵니다.
*/
window.SITE = {
  // 사이트 오른쪽 아래 연락처. 누구나 볼 수 있으니 공개용 주소만 넣으세요.
  contact: {
    email: 'yarrutau67@gmail.com',
    links: [
      { label: '트위터 @yarrutau1122', url: 'https://x.com/yarrutau1122' },
    ],
  },

  // 메인 화면 곡 목록. 맨 위 곡이 처음에 보입니다.
  songs: [
    // { title: '곡 제목', type: '오리지널', singers: ['kapshong'], credit: '작곡 OOO', youtube: 'https://youtu.be/...' },
    // { title: '곡 제목', type: '커버', singers: ['chansa', 'bellein'], credit: '', youtube: 'https://youtu.be/...' },
  ],

  // color: 배경, ink: 글자, accent: 포인트, onAccent: 포인트 위 글자
  // focus: 메인 화면에서 잘려 보일 때의 가로 중심
  // en: 탭에 작게 나오는 영문 이름, bgText: 개인 페이지 그림 뒤 큰 글자(비우면 이름)
  // subname: 이름 밑 다른 표기, descriptionJa/descriptionEn: 일본어/영어 소개. 줄바꿈은 \n
  // voice: 말 시키기(TTS) 음원 폴더. 비워 두면 "음원 준비 중"으로 나옵니다.
  // soon: true 이면 색만 있는 "준비 중" 자리입니다. 새 친구가 오면 soon을 지우고 내용을 채우세요.
  // versions: 버전이 여러 개일 때만. 안에 적은 값이 그 버전을 골랐을 때 덮어써집니다.
  characters: [
    {
      id: 'ryookoro-ki',
      name: '료오코로 키',
      en: 'Ryookoro Ki',
      bgText: '鬼',
      subname: '獵殺 鬼(りょうおころ き)',
      hashtag: 'UTAU_RyookoroKi',
      cv: '가온누리',
      illust: '',
      color: '#000000', ink: '#cb6efa', accent: '#cb6efa', onAccent: '#000000',
      image: 'assets/img/ryookoro-ki.webp',
      thumb: 'assets/img/ryookoro-ki-small.webp',
      focus: '78%',
      voice: 'assets/voices/ryookoro-ki/', // 말 시키기 음원
      logo: 'assets/img/logo-ryookoro-ki-light.webp', // 검은 배경용
      description: '노래가 취미인 퇴마사입니다. 개인적으로 수집한 유령들은 코러스로 사용됩니다.',
      descriptionJa: '歌が趣味の退魔師です。個人的に集めた幽霊たちはコーラスとして使っています。',
      versions: [
        {
          id: 'normal',
          label: '기본',
          sample: 'assets/audio/ryookoro-ki.mp3',
          downloads: [{ type: 'VCV', url: 'https://bowlroll.net/file/363249', size: '70MB' }],
        },
        {
          id: 'whisper',
          label: '위스퍼',
          subname: '獵殺 鬼(whisper / ウィスパー)',
          description: '키가 수집했던 유령들이 모여 만들어 낸 키의 흉내입니다.\n안광이 없습니다.',
          descriptionJa: 'きが収集していた幽霊たちが集まって作り出したキーの真似です。',
          color: '#cb6efa', ink: '#000000', accent: '#000000', onAccent: '#cb6efa',
          image: 'assets/img/ryookoro-ki-whisper.webp',
          logo: 'assets/img/logo-ryookoro-ki.webp', // 원본 색
          sample: 'assets/audio/ryookoro-ki-whisper.mp3',
          voice: 'assets/voices/ryookoro-ki-whisper/',
          downloads: [{ type: 'CV', url: 'https://bowlroll.net/file/365289' }],
        },
      ],
    },
    {
      id: 'chansa',
      name: '찬사',
      en: 'Chansa',
      subname: 'chansa',
      hashtag: 'UTAU_Chansa',
      cv: '이레온',
      illust: '',
      color: '#ff9d1c', ink: '#000000', accent: '#000000', onAccent: '#ff9d1c',
      image: 'assets/img/chansa.webp',
      thumb: 'assets/img/chansa-small.webp',
      focus: '35%',
      logo: 'assets/img/logo-chansa.webp',
      description: '파티와 치즈, 술을 좋아하는 고양이입니다.',
      descriptionJa: 'パーティーとチーズ、お酒が好きな猫です。',
      sample: 'assets/audio/chansa.mp3', // 도레미파솔라시도
      voice: 'assets/voices/chansa/',
      downloads: [
        { type: 'VCV', size: '52MB', parts: [
          { url: 'assets/downloads/chansa-vcv-1.zip', size: '19MB', file: 'chansa_VCV_1.zip' },
          { url: 'assets/downloads/chansa-vcv-2.zip', size: '19MB', file: 'chansa_VCV_2.zip' },
          { url: 'assets/downloads/chansa-vcv-3.zip', size: '14MB', file: 'chansa_VCV_3.zip' },
        ] },
        { type: 'CV', size: '24MB', parts: [
          { url: 'assets/downloads/chansa-cv-1.zip', size: '13MB', file: 'chansa_CV_1.zip' },
          { url: 'assets/downloads/chansa-cv-2.zip', size: '12MB', file: 'chansa_CV_2.zip' },
        ] },
      ],
      // 위 값이 기본 버전이고, 어린이 버전은 적은 값만 덮어씁니다
      versions: [
        { id: 'normal', label: '기본' },
        {
          id: 'kid',
          label: '어린이',
          subname: '어린이찬사 (kid)',
          sample: 'assets/audio/chansa-kid.mp3',
          voice: 'assets/voices/chansa-kid/',
          downloads: [{ type: 'VCV', size: '45MB', parts: [
            { url: 'assets/downloads/chansa-kid-vcv-1.zip', size: '19MB', file: 'chansa_kid_VCV_1.zip' },
            { url: 'assets/downloads/chansa-kid-vcv-2.zip', size: '19MB', file: 'chansa_kid_VCV_2.zip' },
            { url: 'assets/downloads/chansa-kid-vcv-3.zip', size: '8MB', file: 'chansa_kid_VCV_3.zip' },
          ] }],
        },
      ],
    },
    {
      id: 'kapshong',
      name: '카프숑',
      en: 'KapSchon',
      subname: 'KapSchon',
      hashtag: 'UTAU_KapSchon',
      cv: '뺙',
      illust: '',
      color: '#b3ff00', ink: '#000000', accent: '#ff00bb', onAccent: '#000000',
      image: 'assets/img/kapshong.webp',
      thumb: 'assets/img/kapshong-small.webp',
      focus: '40%',
      logo: 'assets/img/logo-kapshong.webp',
      description: '자비와 부로 8천만 신도를 거느린 사이비 종교 언카프카의 교주입니다. 여러곳을 거느리며 공포정치를 펼칩니다.\n자신을 신이라고 생각합니다.',
      descriptionEn: 'The leader of the cult "Unkafka," commanding 80 million followers through mercy and wealth. Ruling over numerous territories, he enforces a reign of terror.\nHe believes himself to be a god.',
      sample: 'assets/audio/kapshong.mp3',
      voice: 'assets/voices/kapshong/',
      // 용량이 커서 여러 조각으로 나눠 둬습니다. parts에 조각을 차례로 적습니다.
      downloads: [{ type: 'VCV', size: '37MB', parts: [
        { url: 'assets/downloads/kapshong-vcv-1.zip', size: '19MB', file: 'KapSchon_VCV_1.zip' },
        { url: 'assets/downloads/kapshong-vcv-2.zip', size: '19MB', file: 'KapSchon_VCV_2.zip' },
      ] }],
    },
    {
      id: 'bellein',
      name: '벨레인',
      en: 'Bellein',
      subname: 'ベレイン(Bellein)',
      hashtag: 'UTAU_Bellein',
      cv: '220',
      illust: '',
      color: '#2895ed', ink: '#000000', accent: '#fc1260', onAccent: '#000000',
      image: 'assets/img/bellein.webp',
      thumb: 'assets/img/bellein-small.webp',
      focus: '20%',
      logo: 'assets/img/logo-bellein.webp',
      logoBg: '#ffffff', // 로고의 파랑이 배경에 묻혀서 까는 판
      description: '프로듀서를 하려고 했는데, 정신 차려보니 가수를 하고 있습니다.',
      descriptionJa: 'プロデューサーをやろうと思っていたのに、気がつけば歌手をしていました。',
      sample: 'assets/audio/bellein.mp3',
      voice: 'assets/voices/bellein/',
      downloads: [{ type: 'VCV', url: 'assets/downloads/bellein.zip', size: '17MB', file: 'Bellein.zip' }],
    },
    {
      id: 'sereni',
      name: '세레니',
      en: 'Serenity',
      subname: 'Serenity',
      hashtag: 'UTAU_Serenity',
      cv: 'Naz',
      illust: '',
      color: '#f3dae1', ink: '#000000', accent: '#000000', onAccent: '#f3dae1', // Pale Pink Serenity
      image: 'assets/img/sereni.webp',
      thumb: 'assets/img/sereni-small.webp',
      focus: '50%',
      description: '전남편 \'제이드\'를 잊어버린 멍청한 리트리버.\n제이드의 권유로 노래를 시작했다.',
      descriptionJa: '元夫の「ジェイド」を忘れてしまった、おバカなレトリバー。\nジェイドに勧められて歌を始めた。',
      sample: 'assets/audio/sereni.mp3',
      voice: 'assets/voices/sereni/',
      downloads: [{ type: 'VCV', size: '29MB', parts: [
        { url: 'assets/downloads/sereni-vcv-1.zip', size: '19MB', file: 'Serenity_VCV_1.zip' },
        { url: 'assets/downloads/sereni-vcv-2.zip', size: '11MB', file: 'Serenity_VCV_2.zip' },
      ] }],
    },
    {
      id: 'nanaba',
      name: '나나바',
      en: 'Nanaba',
      subname: 'Nanaba',
      hashtag: 'UTAU_Nanaba',
      cv: '냥랄',
      illust: '',
      color: '#ffe135', ink: '#000000', accent: '#000000', onAccent: '#ffe135',
      image: 'assets/img/nanaba.webp',
      thumb: 'assets/img/nanaba-small.webp',
      focus: '45%',
      description: '',
      sample: 'assets/audio/nanaba.mp3',
      voice: 'assets/voices/nanaba/',
      downloads: [{ type: 'VCV', size: '69MB', parts: [
        { url: 'assets/downloads/nanaba-vcv-1.zip', size: '19MB', file: 'Nanaba_VCV_1.zip' },
        { url: 'assets/downloads/nanaba-vcv-2.zip', size: '19MB', file: 'Nanaba_VCV_2.zip' },
        { url: 'assets/downloads/nanaba-vcv-3.zip', size: '19MB', file: 'Nanaba_VCV_3.zip' },
        { url: 'assets/downloads/nanaba-vcv-4.zip', size: '13MB', file: 'Nanaba_VCV_4.zip' },
      ] }],
    },
  ],
};
