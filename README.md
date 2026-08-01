# ShiftMate GitHub版 v1

## GitHubへ置くファイル
- index.html
- login.html
- admin.html
- staff.html
- config.js
- api-client.js
- manifest.json
- shiftmate-icon-512.png
- shiftmate-apple-touch-icon-180.png

## GASへ貼るファイル
- ShiftMate_API_Code_v1_0.txt の全文を Code.gs に貼り替え

## GASのデプロイ
1. 「新しいデプロイ」→「ウェブアプリ」
2. 実行するユーザー：自分
3. アクセスできるユーザー：全員
4. 発行された /exec URL を config.js の API_URL に設定
5. GitHubへ全ファイルをアップロード

## 動作
- index.html がログイン入口
- セッションあり：権限と前回画面に応じて admin.html / staff.html
- セッションなし：ログイン画面
- 画面はGitHub Pages上に残るため、GASの青い案内バーは表示されません

## 注意
GitHub PagesとGASは別オリジンです。環境によってGASの応答がCORSで遮断される場合があります。
その場合は、次段階でFirebase Functions / Cloud Run / Supabase Edge Functions等へAPIを移す必要があります。


## v1.2 モーション・ロード整理
- アプリ起動時：共通のShiftMateスプラッシュ
- ログイン直後：スタッフは「シフト情報」、管理者は「店舗情報」を準備
- 管理者⇄スタッフ：全画面ローダーを出さず、短いフェードだけ
- 月変更・保存・公開：画面全体ではなく対象箇所の表示を利用
- 端末の「視差効果を減らす」設定にも対応
