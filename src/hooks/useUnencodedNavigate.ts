/**
 * 自定義導航 hook，避免 React Router 自動編碼 URL
 * 使用 window.history API 直接操作瀏覽器歷史記錄
 */

import { useEffect } from 'react';
import { useNavigate as useReactRouterNavigate } from 'react-router-dom';

export function useUnencodedNavigate() {
  const reactNavigate = useReactRouterNavigate();

  // 監聽瀏覽器前進/後退按鈕
  useEffect(() => {
    const handlePopState = () => {
      // 當瀏覽器歷史記錄變化時，觸發 React Router 更新
      window.dispatchEvent(new PopStateEvent('popstate'));
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = (path: string, options?: { replace?: boolean }) => {
    // 確保路徑以 / 開頭
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // 使用 window.history 直接更新 URL，不進行編碼
    if (options?.replace) {
      window.history.replaceState(null, '', normalizedPath);
    } else {
      window.history.pushState(null, '', normalizedPath);
    }

    // 觸發 React Router 更新
    reactNavigate(normalizedPath, { replace: options?.replace });
  };

  return navigate;
}

