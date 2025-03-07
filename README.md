# ownip-worker

## 概要

`ownip-worker`は、Cloudflare Workersを使用してIPアドレスに関する情報を取得するアプリケーションです。  
どのISPからアクセスしているかを、ネットワーク上から確認する用途で使用します。  
また。RDAP（Registration Data Access Protocol）を使用してIPアドレスに関連する情報を取得する機能を提供します。

- **IPアドレスのプライベート判定**: 指定されたIPアドレスがプライベートIPかどうかを判定します。
- **RDAP情報の取得**: 指定されたIPアドレスに関連するRDAP情報を取得します。
- **キャッシュ機能**: リクエスト結果をキャッシュし、パフォーマンスを向上させます。

## エンドポイント

- メインエンドポイント:

  - `/`  
    クライアントのIPアドレスがプライベートIPかどうかを判定し、RDAP情報を取得します。

出力例:

```json
{ "status": "ok", "ClientIP": "72.14.201.153", "Name": "GOOGLE", "Organization": "" }
```

- RDAP情報取得エンドポイント:
  - `/rdap/all`  
    クライアントのIPアドレスに関連するすべてのRDAP情報を取得します。

## 使用方法

### 環境設定

1. **依存関係のインストール**:

```sh
npm install
```

2. **Wranglerの設定**:
   `wrangler.toml`ファイルを作成し、Cloudflare Workersの設定を行います。

### スクリプト

- **開発サーバーの起動**:

  ```sh
  npm run dev
  ```

- **デプロイ**:
  基本GitHub Actionsで自動デプロイされるため、手動でデプロイする必要はありません。

  ```sh
  npm run deploy
  ```

- **テストの実行**:
  ```sh
  npm test
  ```

## 開発

### ディレクトリ構成

- `src/`: ソースコード
- `test/`: テストコード

### 主なファイル

- `src/index.ts`: エントリーポイント
- `src/rdap.ts`: RDAP関連のロジック
- `src/utils/ip.ts`: IPアドレス関連のユーティリティ関数

### テスト

テストは`vitest`を使用して実行します。テストを実行するには、以下のコマンドを使用します。

```sh
npm test
```

## ライセンス

Copyright (C) 2024-2025 Adenohitu
このソフトウェアは GNU Affero General Public License v3.0 (AGPLv3)のライセンスのもとで公開されています。
