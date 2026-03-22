import { useCallback, useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearLRUWords, clearStarredWords, readLRUWords, readStarredWords } from '../utils/word-record-utils';
import { useRadicalTooltip } from '../hooks/useRadicalTooltip';

type Lang = 'a' | 't' | 'h' | 'c';

interface StarredPageProps {
  lang: Lang;
  entry?: string;
}

function getLangPrefix(lang: Lang): string {
  if (lang === 't') return "'";
  if (lang === 'h') return ':';
  if (lang === 'c') return '~';
  return '';
}

function buildWordPath(word: string, prefix: string): string {
  if (word.startsWith('@')) {
    const radical = word.slice(1);
    const radicalBase = prefix === '~' ? '/~@' : '/@';
    if (!radical) return radicalBase;
    return `${radicalBase}${encodeURIComponent(radical)}`;
  }
  return `/${prefix}${encodeURIComponent(word)}`;
}

function buildTooltipId(word: string, path: string, prefix: string): string {
  if (word.startsWith('@')) {
    return prefix === '~' ? `~${word}` : word;
  }
  return `entry:${path}`;
}

export function StarredPage({ lang }: StarredPageProps) {
  const navigate = useNavigate();
  const [starredWords, setStarredWords] = useState<string[]>([]);
  const [recentWords, setRecentWords] = useState<string[]>([]);
  const prefix = useMemo(() => getLangPrefix(lang), [lang]);
  useRadicalTooltip();

  const loadWords = useCallback(() => {
    setStarredWords(readStarredWords(lang));
    setRecentWords(readLRUWords(lang));
  }, [lang]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const buildPath = useCallback((word: string) => buildWordPath(word, prefix), [prefix]);

  const handleWordClick = useCallback(
    (event: ReactMouseEvent<HTMLAnchorElement>, word: string) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      navigate(buildPath(word));
    },
    [buildPath, navigate]
  );

  const handleClearRecent = useCallback(() => {
    if (!window.confirm('確定要清除瀏覽紀錄？')) return;
    clearLRUWords(lang);
    setRecentWords([]);
  }, [lang]);

  const handleClearStarred = useCallback(() => {
    if (!window.confirm('確定要清除收藏字詞？')) return;
    clearStarredWords(lang);
    setStarredWords([]);
  }, [lang]);

  return (
    <div className="result">
      <h1 className="title">字詞紀錄簿</h1>

      <div className="starred-section">
        <h3>
          收藏字詞
          <input
            id="btn-clear-starred"
            type="button"
            className="btn-default btn btn-tiny"
            value="清除"
            style={{ marginLeft: '10px', display: starredWords.length > 0 ? '' : 'none' }}
            onClick={handleClearStarred}
          />
        </h3>
        <div className="word-list">
          {starredWords.length === 0 ? (
            <p className="bg-info">（請按詞條右方的 <i className="icon-star-empty"></i> 按鈕，即可將字詞加到這裡。）</p>
          ) : (
            starredWords.map((word) => {
              const path = buildPath(word);
              const tooltipId = buildTooltipId(word, path, prefix);
              return (
                <div key={`starred-${word}`} style={{ clear: 'both', display: 'block' }}>
                  <span>·</span>
                  <a href={path} data-radical-id={tooltipId} onClick={(event) => handleWordClick(event, word)}>
                    {word}
                  </a>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="recent-section">
        <br />
        <h3 id="lru">
          最近查閱過的字詞
          <input
            id="btn-clear-lru"
            type="button"
            className="btn-default btn btn-tiny"
            value="清除"
            style={{ marginLeft: '10px', display: recentWords.length > 0 ? '' : 'none' }}
            onClick={handleClearRecent}
          />
        </h3>
        <div className="word-list">
          {recentWords.map((word) => {
            const path = buildPath(word);
            const tooltipId = buildTooltipId(word, path, prefix);
            return (
              <div key={`recent-${word}`} style={{ clear: 'both', display: 'block' }}>
                <span>·</span>
                <a href={path} data-radical-id={tooltipId} onClick={(event) => handleWordClick(event, word)}>
                  {word}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
