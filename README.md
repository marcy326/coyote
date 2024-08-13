# Coyote Game

https://coyote-8h8h.onrender.com

## 技術スタック

### バックエンド
- [FastAPI](https://fastapi.tiangolo.com/): Python製の高速で柔軟なWebフレームワーク
- [Uvicorn](https://www.uvicorn.org/): FastAPIのためのASGIサーバー
- [Pydantic](https://pydantic-docs.helpmanual.io/): データバリデーションとデータモデル定義のためのライブラリ

### フロントエンド
- [React](https://reactjs.org/): JavaScriptのUIライブラリ
- [Redux](https://redux.js.org/): アプリケーションの状態管理ライブラリ
- [Axios](https://axios-http.com/): HTTPクライアントライブラリ
- [Tailwind CSS](https://tailwindcss.com/): ユーティリティファーストのCSSフレームワーク

### インフラ
- [Docker](https://www.docker.com/): コンテナ化技術
- [Render](https://render.com/): クラウドホスティングサービス

## 主な機能

- 部屋の作成と参加
- オフラインでのゲーム開始
- オンラインでのゲーム開始
- カードの表示
- 数字とコヨーテの宣言
- ゲーム終了

## 開発者向け情報

### セットアップ
#### 開発時

1. リポジトリをクローンする。
```bash
git clone https://github.com/marcy326/coyote.git
```
2. プロジェクトのディレクトリでdocker composeをビルド&起動する。
```bash
cd coyote
docker compose up --build
```

#### デプロイ

1. GitHubにリポジトリを作成する。

2. render.comでGitHubアカウントを紐付ける。

3. Blueprintsのページから「+ New Blueprint Instance」をクリックし、作成したリポジトリを接続する。

4. 環境変数を入力する。
- REACT_APP_API_BASE_URL: httpsから始まるバックエンドのURL
- REACT_APP_WS_BASE_URL: バックエンドURLのhttpsをwssに変更したURL
- FRONTEND_ORIGIN: httpsから始まるフロントエンドのURL

5. デプロイボタンをクリックする。

6. 以降はmainブランチを更新するたびに自動でデプロイされる。

## 今後の改善点
- [ ] ライフポイント機能の追加
- [ ] ゲーム画面の改善
- [ ] WebSocketの接続管理の改善
- [ ] DB(Roomデータ)のライフサイクル
- [ ] ゲームの履歴管理
