// Offline API handler must be imported before any fetch calls
import './offline-api.ts'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * 在應用啟動前修正 URL，避免編碼字元顯示
 * 這必須在 React Router 初始化之前執行
 */
function fixInitialURL() {
  const currentPath = window.location.pathname;

  // 如果路徑包含編碼字元，立即解碼
  if (currentPath.includes('%')) {
    try {
      const decoded = decodeURIComponent(currentPath);
      if (decoded !== currentPath) {
        // 使用 replaceState 立即修正 URL，不觸發頁面重新載入
        window.history.replaceState(null, '', decoded);
      }
    } catch (e) {
      console.warn('初始 URL 解碼失敗:', e);
    }
  }
}

/**
 * 攔截 history API，確保所有導航操作都使用未編碼的 URL
 */
function setupHistoryInterceptor() {
  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  window.history.pushState = function(state, title, url) {
    if (typeof url === 'string' && url.includes('%')) {
      try {
        const decoded = decodeURIComponent(url);
        return originalPushState.call(this, state, title, decoded);
      } catch {
        // 解碼失敗時使用原始 URL
      }
    }
    return originalPushState.call(this, state, title, url);
  };

  window.history.replaceState = function(state, title, url) {
    if (typeof url === 'string' && url.includes('%')) {
      try {
        const decoded = decodeURIComponent(url);
        return originalReplaceState.call(this, state, title, decoded);
      } catch {
        // 解碼失敗時使用原始 URL
      }
    }
    return originalReplaceState.call(this, state, title, url);
  };
}

// 在渲染前先修正 URL 和設置攔截器
fixInitialURL();
setupHistoryInterceptor();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
