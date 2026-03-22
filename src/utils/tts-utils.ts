/**
 * 語音合成（TTS）工具
 * 複刻原專案 view.ls 中 Translations.onClick 的行為
 * - 使用 SpeechSynthesisUtterance
 * - 語言：英(en-US) / 法(fr-FR) / 德(de-DE)
 * - 文字清理規則：移除 (A) 標記、非 ASCII 字元、", CL:" 片段、以及 '|' 後的非標點內容
 */

export type TTSSupportedLabel = '英' | '法' | '德';

/**
 * 語言代碼對應（英/法/德）
 */
export function getLanguageCode(label: string): string {
  switch (label) {
    case '英':
      return 'en-US';
    case '法':
      return 'fr-FR';
    case '德':
      return 'de-DE';
    default:
      return 'en-US';
  }
}

/**
 * 去除 HTML 標籤
 */
function untag(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * 轉為字串
 */
function normalizeToString(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  return String(value ?? '');
}

/**
 * 清理用於 TTS 的文字（複刻原專案清理規則）
 */
export function cleanTextForTTS(value: unknown): string {
  let text = normalizeToString(value);
  text = untag(text);
  // 移除 , CL: 開頭之後的內容
  text = text.replace(/,\s*CL:.*/g, '');
  // 移除 | 後的非標點內容（近似原則：直到遇到常見標點或結尾）
  text = text.replace(/\|[^,\.\(\)\[\]\s]+/g, '');
  // 移除如 (A) 的大寫標記
  text = text.replace(/\([A-Z]\)/g, '');
  // 僅保留 ASCII 字符
  text = text.replace(/[^\x00-\x7F]/g, '');
  // 收斂多餘空白
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

/**
 * 挑選法語 voice（複刻原專案 page-rendering.tsx pickFrVoice）
 */
function pickFrVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  try {
    voices = voices || [];
    const fr = voices.filter((v) => v && v.lang && String(v.lang).toLowerCase().indexOf('fr') === 0);
    const google = fr.find((v) => (v.name || '').toLowerCase().indexOf('google') >= 0 && String(v.lang).toLowerCase() === 'fr-fr');
    if (google) return google;
    const frfr = fr.find((v) => String(v.lang).toLowerCase() === 'fr-fr');
    if (frfr) return frfr;
    const frca = fr.find((v) => String(v.lang).toLowerCase() === 'fr-ca');
    if (frca) return frca;
    return fr[0] || null;
  } catch {
    return null;
  }
}

/**
 * 挑選英語 voice，避免較差音色（Compact/Fred 等金屬音）
 * 複刻原專案 page-rendering.tsx pickEnVoice
 */
function pickEnVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  try {
    voices = voices || [];
    let en = voices.filter((v) => v && v.lang && String(v.lang).toLowerCase().indexOf('en') === 0);
    en = en.filter((v) => {
      const nm = (v.name || '').toLowerCase();
      return nm.indexOf('compact') < 0 && nm !== 'fred';
    });
    const prefName =
      en.find((v) => (v.name || '').toLowerCase().indexOf('samantha') >= 0) ||
      en.find((v) => (v.name || '').toLowerCase().indexOf('alex') >= 0);
    if (prefName) return prefName;
    const enus = en.find((v) => String(v.lang).toLowerCase() === 'en-us');
    if (enus) return enus;
    const engb = en.find((v) => String(v.lang).toLowerCase() === 'en-gb');
    if (engb) return engb;
    const enau = en.find((v) => String(v.lang).toLowerCase() === 'en-au');
    if (enau) return enau;
    return en[0] || null;
  } catch {
    return null;
  }
}

/**
 * 在瀏覽器端發聲（需由使用者互動觸發）
 * 完整複刻原專案 page-rendering.tsx 的 TTS 邏輯：
 * - Chrome 的 voices 非同步載入，若為空須等待 voiceschanged 再選 voice 播放，否則會用預設低品質語音（金屬音）
 * - 英語：優先 Samantha/Alex，排除 Compact/Fred
 * - Firefox 英語：rate 0.95、pitch 1.02 降低金屬音
 */
export function speakText(label: string, text: string): void {
  try {
    if (typeof window === 'undefined') return;
    const syn = (window as Window & { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
    const Utter = (window as Window & { SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance }).SpeechSynthesisUtterance;
    if (!syn || !Utter) return;
    const cleaned = cleanTextForTTS(text);
    if (!cleaned) return;

    const u = new Utter(cleaned);
    u.lang = getLanguageCode(label);
    u.volume = 1.0;
    u.rate = 1.0;

    const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
    const isFirefox = ua.indexOf('Gecko/') >= 0 && ua.indexOf('Chrome/') < 0;

    let voices: SpeechSynthesisVoice[] = [];
    try {
      voices = syn.getVoices ? syn.getVoices() : [];
    } catch {
      voices = [];
    }

    // 法語：voices 為空時等待 voiceschanged，否則選 fr-* voice
    if (label === '法') {
      if (!voices || voices.length === 0) {
        const handler = () => {
          try {
            const vv = syn.getVoices ? syn.getVoices() : [];
            const chosen = pickFrVoice(vv);
            if (chosen) {
              try {
                syn.cancel();
              } catch {
                /* ignore */
              }
              const u2 = new Utter(cleaned);
              u2.lang = chosen.lang;
              u2.voice = chosen;
              u2.volume = 1.0;
              u2.rate = 1.0;
              syn.speak(u2);
            }
          } catch {
            /* ignore */
          }
        };
        try {
          syn.onvoiceschanged = handler;
        } catch {
          /* ignore */
        }
        return;
      }
      const chosenNow = pickFrVoice(voices);
      if (chosenNow) {
        u.voice = chosenNow;
        u.lang = chosenNow.lang;
      }
    }

    // 英語：voices 為空時等待 voiceschanged，否則選 en-* voice；Firefox 微調 rate/pitch
    if (label === '英') {
      if (!voices || voices.length === 0) {
        const handler = () => {
          try {
            const vv = syn.getVoices ? syn.getVoices() : [];
            const chosenE = pickEnVoice(vv);
            if (chosenE) {
              try {
                syn.cancel();
              } catch {
                /* ignore */
              }
              const uE = new Utter(cleaned);
              uE.lang = chosenE.lang;
              uE.voice = chosenE;
              uE.volume = 1.0;
              uE.rate = isFirefox ? 0.95 : 1.0;
              uE.pitch = isFirefox ? 1.02 : 1.0;
              syn.speak(uE);
            }
          } catch {
            /* ignore */
          }
        };
        try {
          syn.onvoiceschanged = handler;
        } catch {
          /* ignore */
        }
        return;
      }
      const chosenNowE = pickEnVoice(voices);
      if (chosenNowE) {
        u.voice = chosenNowE;
        u.lang = chosenNowE.lang;
      }
      if (isFirefox) {
        u.rate = 0.95;
        u.pitch = 1.02;
      }
    }

    syn.speak(u);
  } catch (err) {
    try {
      console.warn('[TTS] 語音播放失敗', err);
    } catch {
      /* ignore */
    }
  }
}
