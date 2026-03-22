/**
 * 字典發音音檔工具
 * 複刻原專案 DictionaryViews 的 getAudioUrl 與 playAudio 行為
 */

export type DictionaryLang = 'a' | 't' | 'h' | 'c';

const AUDIO_CDN_MAP: Record<DictionaryLang, string> = {
  a: 'https://203146b5091e8f0aafda-15d41c68795720c6e932125f5ace0c70.ssl.cf1.rackcdn.com',
  h: 'https://a7ff62cf9d5b13408e72-351edcddf20c69da65316dd74d25951e.ssl.cf1.rackcdn.com',
  t: 'https://1763c5ee9859e0316ed6-db85b55a6a3fbe33f09b9245992383bd.ssl.cf1.rackcdn.com',
  c: 'https://203146b5091e8f0aafda-15d41c68795720c6e932125f5ace0c70.ssl.cf1.rackcdn.com', // 兩岸詞典使用華語路由
};

/**
 * 根據語言與 audio_id 取得音檔 URL
 */
export function getAudioUrl(lang: DictionaryLang, audioId: string): string {
  const base = AUDIO_CDN_MAP[lang] ?? AUDIO_CDN_MAP.a;
  return `${base}/${audioId}.ogg`;
}

let currentAudio: HTMLAudioElement | null = null;
let currentToken = 0;
let currentRequestKey: string | null = null;

function buildAudioCandidates(url: string): string[] {
  const match = url.match(/^(.*)\.(\w+)(\?.*)?$/);
  if (!match) return [url];
  const base = match[1];
  const query = match[3] || '';
  // iPad Safari 對 ogg 支援不穩，先嘗試 mp3，再退回 ogg
  return [`${base}.mp3${query}`, `${base}.ogg${query}`];
}

/**
 * 播放音檔 URL（使用 HTML5 Audio）
 * 點擊同一按鈕可停止播放
 */
export function playAudioUrl(url: string, onStateChange?: (playing: boolean) => void): void {
  if (typeof window === 'undefined') return;
  const token = ++currentToken;
  const requestKey = url;

  const stop = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    currentRequestKey = null;
    onStateChange?.(false);
  };

  if (currentAudio && currentRequestKey === requestKey) {
    stop();
    return;
  }

  stop();
  const audio = new Audio();
  // iOS Safari 友善設定
  audio.preload = 'none';
  audio.setAttribute('playsinline', 'true');
  audio.setAttribute('webkit-playsinline', 'true');
  currentAudio = audio;
  currentRequestKey = requestKey;

  audio.addEventListener('ended', () => {
    if (currentAudio === audio) {
      currentAudio = null;
      onStateChange?.(false);
    }
  });

  audio.addEventListener('error', () => {
    if (currentAudio === audio) {
      currentAudio = null;
      onStateChange?.(false);
    }
  });

  const candidates = buildAudioCandidates(url);
  void (async () => {
    for (const candidate of candidates) {
      if (currentToken !== token || currentAudio !== audio) return;
      try {
        audio.src = candidate;
        audio.load();
        await audio.play();
        if (currentToken !== token || currentAudio !== audio) return;
        onStateChange?.(true);
        return;
      } catch (err) {
        console.warn('[Audio] 播放失敗，嘗試下一種格式:', candidate, err);
      }
    }
    if (currentToken === token && currentAudio === audio) {
      currentAudio = null;
      currentRequestKey = null;
      onStateChange?.(false);
    }
  })();
}

/**
 * 停止目前播放中的音檔
 */
export function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  currentRequestKey = null;
}
