# 📌 React TaskBoard アプリ 引継ぎ・S3運用ガイド

このドキュメントは、React + TypeScript 製の「タスクボードアプリ」を AWS S3 にホスティングし、今後の保守・修正を行うための引継ぎ資料です。

---

## ✅ 保管場所（AWS S3）

- **バケット名**：`your-bucket-name`
- **ホスティング設定**：静的ウェブサイトホスティング有効（index.htmlをエントリポイントとする）
- **公開URL**：https://your-bucket-name.s3-website-xx-region.amazonaws.com/

---

## 🧱 プロジェクト構成（重要ファイル一覧）

\`\`\`
my-task-board/
├── public/
│   └── index.html            ← 初期HTMLテンプレート
├── src/
│   ├── TaskBoard.tsx         ← タスクボードの主要UIロジック
│   ├── App.tsx               ← TaskBoardを読み込むエントリポイント
│   └── index.tsx             ← Reactアプリ起動ポイント
├── package.json              ← 使用ライブラリとスクリプト定義
├── tsconfig.json             ← TypeScriptの設定
├── README_for_S3_and_Dev.md ← 本ドキュメント
\`\`\`

---

## 🚀 修正・再デプロイの流れ

### 1. ソースコードを修正

#### よく変更するファイル：
| ファイル | 役割 |
|---------|------|
| `src/TaskBoard.tsx` | 表示ロジック・フィルタリング・表示スタイルなど |
| `src/App.tsx` | UI全体の構成（画面追加時など） |
| `package.json` | ライブラリ追加・バージョン更新時 |
| `.env`（任意） | APIエンドポイントや設定値の外部化時に使用 |

### 2. ローカルで動作確認

\`\`\`bash
npm install     # 初回のみ
npm start       # http://localhost:3000 で確認
\`\`\`

### 3. 本番用にビルド

\`\`\`bash
npm run build
\`\`\`

→ `build/` フォルダが出力される（これをS3にアップロード）

### 4. S3 にアップロード

1. AWSコンソールからバケットを開く
2. `build/` フォルダの中身をすべてアップロード
   - `index.html`
   - `static/` フォルダ など
3. 「静的ウェブサイトホスティング」のエンドポイントで公開確認

---

## ⚠ 注意点

- Mendix APIにアクセスするため、**CORS設定済みの環境**または **Lambdaプロキシ経由**が必要です
- `package.json` に `proxy` がある場合、本番環境では無効になるため注意
- 本番用 fetch URL は必ず **フルURL** で指定してください

---

## 👨‍🔧 開発環境

- Node.js 18 以上（推奨）
- TypeScript
- React 18（Create React Appベース）

---

## 📦 初期セットアップが必要な場合

\`\`\`bash
git clone https://github.com/your-org/my-task-board.git
cd my-task-board
npm install
npm start
\`\`\`

---

## 🧩 担当者向け連絡メモ

| 項目 | 内容 |
|------|------|
| メンテナ担当 | 鈴木一（SmartFactory/DX推進） |
| AWSバケット管理 | 情報システム部 or 工場IT担当 |
| Mendix環境 | `https://glicocmmsbeta100.mendixcloud.com/...` |
| API連携設定 | Studio Proで公開されたOData + CORS許可が必要（管理者向け） |

---

## 📝 更新履歴（例）

| 日付 | 更新者 | 内容 |
|------|--------|------|
| 2025/07/10 | 鈴木一 | 初版作成 |
| 2025/07/12 | 山田二 | レイアウト調整追加予定 |
