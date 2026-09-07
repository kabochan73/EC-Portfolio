# EC-PORTFOLIO（R3）

架空のミニマル・アパレルブランドの EC サイト。ポートフォリオ用の作り直し **3回目**。

- 設計ドキュメント: [`docs/`](./docs/)
- 1回目: `../ec1/` / 2回目: `../ec2/`
- スタック: Next.js 15 (App Router) + Laravel 12 (API) + PostgreSQL 16 + S3互換ストレージ
- アーキテクチャ: BFF（ブラウザ ↔ Next.js ↔ Laravel）

## R3 のゴール

R2 で未達だった **決済 / トランザクションメール / 自動テスト / 本番デプロイ / ISR / 軽量CMS** を最初から織り込んだ「完成品」。

| 追加要素 | 概要 |
|---|---|
| Stripe 決済（test mode） | Payment Element。Webhook で注文を `paid` に |
| 注文ステータス state machine | `pending → paid → shipped → completed` ＋ `cancelled` |
| トランザクションメール | メール認証 / パスワードリセット / 注文確認 / 発送通知。Resend（本番）/ Mailpit（ローカル） |
| キュー | `database` ドライバ + 専用 worker。Redis は入れない |
| ISR + `revalidateTag` | カタログ・CMS のキャッシュ、管理更新でオンデマンド無効化 |
| 軽量 CMS | トップの Hero / Concept / Lookbook / About を管理画面から編集 |
| 自動テスト | Pest 3（Feature 中心 + 純粋ロジックの Unit） |

詳細は [`docs/00-overview.md`](./docs/00-overview.md)。

## ディレクトリ構成（予定）

```
EC-Portfolio/
├── docker-compose.yml   # ローカル開発環境（全サービス）
├── frontend/            # Next.js
├── backend/             # Laravel（serversideup/php イメージで実行）
└── docs/                # 設計ドキュメント
```

## ローカル開発

**すべて Docker。ホストに PHP / Node / Composer は不要**（frontend の `node_modules` のみ IDE 補完用にホストへ）。

```bash
docker compose up -d
```

- frontend: http://localhost:3000
- backend: http://localhost:8000 （BFF のため通常はブラウザから触らない。curl / Stripe CLI / MCP 用）
- MinIO コンソール: http://localhost:9001
- Mailpit（メール受信箱）: http://localhost:8025

artisan / composer / npm などは `docker compose exec` 経由。詳細は [`docs/07-local-dev.md`](./docs/07-local-dev.md)。

## R2 との違い

スコープ・主要スタックは R2 と同一。変更点:

- 決済（Stripe）・トランザクションメール・キュー・ISR・CMS・自動テストを追加
- 注文ステータスを state machine 化（`paid` / `shipped` / `completed` を追加）
- backend に公開ドメインを付ける（Stripe Webhook 用。署名検証で保護）
- 本番デプロイ（Railway）まで完走する

## 進捗

実装ログは [`docs/rebuild-log.md`](./docs/rebuild-log.md) を参照。
