import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDictionaryEntry, type DictionaryLang } from '../utils/dictionary-cache';

interface FontGroup {
  label: string;
  fonts: { value: string; label: string }[];
}

const FONT_GROUPS: FontGroup[] = [
  { label: '全字庫', fonts: [
    { value: 'kai', label: '楷書' },
    { value: 'sung', label: '宋體' },
    { value: 'ebas', label: '篆文' },
  ]},
  { label: '源雲明體', fonts: [
    { value: 'gwmel', label: '特細' },
    { value: 'gwml', label: '細體' },
    { value: 'gwmr', label: '標準' },
    { value: 'gwmm', label: '正明' },
    { value: 'gwmsb', label: '中明' },
  ]},
  { label: 'Justfont', fonts: [
    { value: 'openhuninn', label: 'Open 粉圓' },
  ]},
  { label: '逢甲大學', fonts: [
    { value: 'shuowen', label: '說文標篆' },
  ]},
  { label: 'cwTeX Q', fonts: [
    { value: 'cwming', label: '明體' },
    { value: 'cwhei', label: '黑體' },
    { value: 'cwyuan', label: '圓體' },
    { value: 'cwkai', label: '楷書' },
    { value: 'cwfangsong', label: '仿宋' },
  ]},
  { label: '思源宋體', fonts: [
    { value: 'shsx', label: '特細' },
    { value: 'shsl', label: '細體' },
    { value: 'shsr', label: '標準' },
    { value: 'shsm', label: '正宋' },
    { value: 'shss', label: '中宋' },
    { value: 'shsb', label: '粗體' },
    { value: 'shsh', label: '特粗' },
  ]},
  { label: '思源黑體', fonts: [
    { value: 'srcx', label: '特細' },
    { value: 'srcl', label: '細體' },
    { value: 'srcn', label: '標準' },
    { value: 'srcr', label: '正黑' },
    { value: 'srcm', label: '中黑' },
    { value: 'srcb', label: '粗體' },
    { value: 'srch', label: '特粗' },
  ]},
  { label: '王漢宗', fonts: [
    { value: 'wt071', label: '中行書' },
    { value: 'wt024', label: '中仿宋' },
    { value: 'wt021', label: '中隸書' },
    { value: 'wt001', label: '細明體' },
    { value: 'wt002', label: '中明體' },
    { value: 'wt003', label: '粗明體' },
    { value: 'wt005', label: '超明體' },
    { value: 'wt004', label: '特明體' },
    { value: 'wt006', label: '細圓體' },
    { value: 'wt009', label: '特圓體' },
    { value: 'wt011', label: '細黑體' },
    { value: 'wt014', label: '特黑體' },
    { value: 'wt064', label: '顏楷體' },
    { value: 'wt028', label: '空疊圓' },
    { value: 'wt034', label: '勘亭流' },
    { value: 'wt040', label: '綜藝體' },
    { value: 'wtcc02', label: '酷儷海報' },
    { value: 'wtcc15', label: '酷正海報' },
    { value: 'wthc06', label: '鋼筆行楷' },
  ]},
];

function getStoredFont(): string {
  try { return window.localStorage.getItem('charimg-font') || 'kai'; }
  catch { return 'kai'; }
}

function setStoredFont(value: string): void {
  try { window.localStorage.setItem('charimg-font', value); }
  catch { /* ignore */ }
}

function charImgUrl(word: string, font: string): string {
  const base = `https://www.moedict.tw/${encodeURIComponent(word)}.png`;
  return font === 'kai' ? base : `${base}?font=${font}`;
}

interface CharacterImageViewProps {
  queryWord: string;
  terms: string[];
  lang: DictionaryLang;
  langTokenPrefix: string;
}

interface TermSegment {
  part: string;
  href: string | null;
  def: string;
}

function mergeEnglishTerms(terms: string[]): string[] {
  const merged: string[] = [];
  for (const term of terms) {
    const token = String(term || '');
    if (!token) continue;
    if (/^[A-Za-z]+$/.test(token) && merged.length > 0 && /^[A-Za-z]+$/.test(merged[merged.length - 1])) {
      merged[merged.length - 1] += token;
      continue;
    }
    merged.push(token);
  }
  return merged;
}

function expandDef(def: string): string {
  return def
    .replace(
      /^\s*<(\d)>\s*([介代副助動名歎嘆形連]?)/,
      (_, num: string, char: string) =>
        `${String.fromCharCode(0x327f + parseInt(num))}${char ? `${char}\u20DE` : ''}`,
    )
    .replace(/<(\d)>/g, (_, num: string) => String.fromCharCode(0x327f + parseInt(num)))
    .replace(/\{(\d)\}/g, (_, num: string) => String.fromCharCode(0x2775 + parseInt(num)))
    .replace(/[（(](\d)[)）]/g, (_, num: string) => String.fromCharCode(0x2789 + parseInt(num)))
    .replace(/\(/g, '（')
    .replace(/\)/g, '）')
    .replace(/<[^>]*>/g, '');
}

function extractDef(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const entry = data as Record<string, unknown>;
  const heteronyms = entry.heteronyms as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(heteronyms)) return '';

  let result = '';
  for (const h of heteronyms) {
    const defs = h.definitions as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(defs)) continue;
    for (const d of defs) {
      const f = d.def as string | undefined;
      const l = d.link as string | undefined;
      if (f) result += f;
      else if (l) result += l;
    }
  }
  return expandDef(result);
}

export function CharacterImageView({ queryWord, terms, lang, langTokenPrefix }: CharacterImageViewProps) {
  const navigate = useNavigate();
  const [segments, setSegments] = useState<TermSegment[]>([]);
  const [shareSupported] = useState(() => typeof navigator !== 'undefined' && !!navigator.share);
  const [font, setFont] = useState(getStoredFont);
  const mergedTerms = useMemo(() => mergeEnglishTerms(terms), [terms]);

  const handleFontChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    setFont(next);
    setStoredFont(next);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSegments() {
      const results: TermSegment[] = [];
      for (const part of mergedTerms) {
        try {
          const response = await fetchDictionaryEntry(part, lang);
          if (cancelled) return;
          const def = response.ok ? extractDef(response.data) : '';
          const href = response.ok ? `/${langTokenPrefix}${part}` : null;
          results.push({ part, href, def });
        } catch {
          if (cancelled) return;
          results.push({ part, href: null, def: '' });
        }
      }
      if (!cancelled) setSegments(results);
    }

    loadSegments();
    return () => { cancelled = true; };
  }, [mergedTerms, lang, langTokenPrefix]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const cleanWord = queryWord.replace(/^['!~:]/, '');
    const title = `${cleanWord} - 萌典`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text: cleanWord, url });
      } catch {
        // User cancelled or share failed
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Clipboard fallback failed
      }
    }
  }, [queryWord]);

  const handleTermClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      event.preventDefault();
      navigate(href);
    },
    [navigate],
  );

  return (
    <div className="result charimg-result">
      <center>
        <img src={charImgUrl(queryWord, font)}
          alt={queryWord}
          style={{ width: queryWord.length > 1 ? 160 : 240 }}
        />

        <div className="charimg-share" style={{ margin: 15 }}>
          <select
            id="font"
            value={font}
            onChange={handleFontChange}
            style={{ marginRight: 8, padding: '4px 8px', fontSize: '0.95em' }}
          >
            {FONT_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.fonts.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            className="btn btn-default charimg-share-btn"
            title={shareSupported ? '分享' : '複製連結'}
            onClick={handleShare}
          >
            <span className="icon-share" />
            {' '}
            {shareSupported ? '分享' : '複製連結'}
          </button>
        </div>

        <table
          className="moetext"
          style={{
            maxWidth: '90%',
            background: '#eee',
            border: '24px #f9f9f9 solid',
            boxShadow: '#d4d4d4 0 3px 3px',
            borderCollapse: 'separate',
            borderSpacing: 0,
          }}
        >
          <tbody>
            {segments.map((segment) => (
              <tr key={segment.part}>
                <td style={{ verticalAlign: 'top', padding: 4 }}>
                  {segment.href ? (
                    <a
                      href={segment.href}
                      onClick={(e) => handleTermClick(e, segment.href!)}
                    >
                      <img src={charImgUrl(segment.part, font)}
                        alt={segment.part}
                        style={{ width: 160, height: 160 }}
                      />
                    </a>
                  ) : (
                    <img src={charImgUrl(segment.part, font)}
                      alt={segment.part}
                      style={{ width: 160, height: 160 }}
                    />
                  )}
                </td>
                <td
                  style={{
                    verticalAlign: 'top',
                    padding: '16px 12px',
                    color: '#006',
                    textAlign: 'left',
                    lineHeight: 1.6,
                    fontSize: '1.05em',
                    wordBreak: 'break-word',
                  }}
                >
                  {segment.href ? (
                    <a
                      href={segment.href}
                      style={{ color: '#006' }}
                      onClick={(e) => handleTermClick(e, segment.href!)}
                    >
                      {segment.def || segment.part}
                    </a>
                  ) : (
                    <span style={{ color: '#999' }}>{segment.part}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </center>
    </div>
  );
}
