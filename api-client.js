
(function () {
  'use strict';

  function normalizeError(error) {
    if (error && error.name === 'AbortError') {
      return new Error('処理に時間がかかり、通信がタイムアウトしました。通信環境またはサーバー処理の混雑を確認して、もう一度お試しください。');
    }
    return error instanceof Error ? error : new Error(String(error || '通信に失敗しました。'));
  }

  async function request(action, args) {
    const config = window.SHIFTMATE_CONFIG || {};
    if (!config.API_URL) throw new Error('API_URLが設定されていません。');

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      Number(config.REQUEST_TIMEOUT_MS || 60000)
    );

    try {
      const response = await fetch(config.API_URL, {
        method: 'POST',
        redirect: 'follow',
        cache: 'no-store',
        credentials: 'omit',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          api: 'shiftmate-v1',
          action: String(action || ''),
          args: Array.isArray(args) ? args : []
        }),
        signal: controller.signal
      });

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (_) {
        throw new Error('APIの応答を読み取れませんでした。GASの公開設定を確認してください。');
      }

      if (!response.ok) {
        throw new Error(result?.error?.message || result?.message || `HTTP ${response.status}`);
      }
      return result;
    } catch (error) {
      throw normalizeError(error);
    } finally {
      clearTimeout(timeout);
    }
  }

  window.ShiftMateAPI = {
    call(name, ...args) {
      return request(name, args);
    }
  };
})();
