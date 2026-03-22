/**
 * 分類詞彙列表頁面
 * 用途：顯示特定分類下的字詞列表（如成語、天文、諺語等）
 * 路由：/={類名}, /'={類名}, /:={類名}, /~={類名}
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRadicalTooltip } from '../hooks/useRadicalTooltip';

type Lang = 'a' | 't' | 'h' | 'c';

interface ListViewProps {
  lang: Lang;
  category: string;
}

const LANG_PREFIX: Record<Lang, string> = {
  a: '',
  t: "'",
  h: ':',
  c: '~',
};
const KEYWORD_SEARCH_THRESHOLD = 30;

function wordPath(lang: Lang, word: string): string {
  return `/${LANG_PREFIX[lang]}${word}`;
}

export function ListView({ lang, category }: ListViewProps) {
  const [words, setWords] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useRadicalTooltip();

  useEffect(() => {
    setLoading(true);
    setError(null);
    setWords([]);

    const prefix = LANG_PREFIX[lang];
    const apiUrl = `/api/${prefix}=${encodeURIComponent(category)}`;

    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`找不到分類：${category}`);
        return res.json();
      })
      .then((data: unknown) => {
        // console.log(data);
        if (Array.isArray(data)) {
          setWords(data as string[]);
        } else {
          setError('資料格式錯誤');
        }
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [lang, category]);

  useEffect(() => {
    setKeyword('');
  }, [lang, category]);

  const shouldShowKeywordSearch = words.length >= KEYWORD_SEARCH_THRESHOLD;
  const normalizedKeyword = keyword.trim();
  const filteredWords = useMemo(() => {
    if (!normalizedKeyword) return words;
    return words.filter((word) => word.includes(normalizedKeyword));
  }, [normalizedKeyword, words]);

  if (loading) {
    return (
      <div id="result" className="result prefer-pinyin-true">
        <div style={{ display: 'inline' }}>
          <h1 itemProp="name" style={{ visibility: 'visible' }}>{category}</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="result" className="result prefer-pinyin-true">
        <div style={{ display: 'inline' }}>
          <h1 itemProp="name" style={{ visibility: 'visible' }}>{category}</h1>
          <span style={{ clear: 'both', display: 'block' }}>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div id="result" className="result prefer-pinyin-true">
      <div style={{ display: 'inline' }}>
        <h1 itemProp="name" style={{ visibility: 'visible' }}>{category}</h1>
        {shouldShowKeywordSearch && (
          <div style={{ clear: 'both', display: 'block', margin: '8px 0 12px' }}>
            <input
              type="search"
              className="query"
              autoComplete="off"
              placeholder={`在 ${category} 中檢索關鍵字`}
              aria-label={`在 ${category} 中檢索關鍵字`}
              value={keyword}
              onChange={(event) => setKeyword(event.currentTarget.value)}
            />
          </div>
        )}
        {shouldShowKeywordSearch && filteredWords.length === 0 && (
          <span style={{ clear: 'both', display: 'block' }}>
            沒有符合「{normalizedKeyword}」的結果
          </span>
        )}
        {filteredWords.map((word) => (
          <span key={word} style={{ clear: 'both', display: 'block' }}>
            <span>·</span>
            <Link to={wordPath(lang, word)}>{word}</Link>
          </span>
        ))}
      </div>
    </div>
  );
}
