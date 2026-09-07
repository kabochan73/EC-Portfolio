# 作り直しログ

ポートフォリオとして3〜4回作り直す。各回の狙い・変更点・反省をここに記録する。

- R1 の記録: `../../ec1/docs/rebuild-log.md`
- R2 の記録: `../../ec2/docs/rebuild-log.md`

---

## R3 — 2026-09-07 開始

**狙い**: R2（`../../ec2/`）は機能がほぼ完成しているが、**決済・トランザクションメール・自動テスト・本番デプロイ・ISR・軽量 CMS** が未達だった。R3 はそれらを最初から織り込んで「完成品」にする。R2 の設計・スコープを土台にゼロから書き直す（ec1→ec2 と同じ「真のリビルド」）。ec2 の `docs/` と実装コードは参照資料として使う。

**スタック**: Next.js 15 (App Router) + Laravel 12 API + PostgreSQL 16 + Docker / Railway（R2 と同一）。R3 追加 = Stripe（`stripe/stripe-php` / `@stripe/stripe-js` / `@stripe/react-stripe-js`）、メール（Laravel Mail + Resend / ローカル Mailpit）、DB キュー、Pest 3。

**識別子**: prefix は `ecp` / `ec-portfolio`（コンテナ `ecp-*` / bucket `ec-portfolio-media` / cart localStorage キー `ecp-cart` / Cookie `ecp_token` / git remote 想定 `github.com/kabochan73/ec-portfolio`）。

### R2 から引き継ぐ設計上の決定（変更なし）

- 性別で分けない・カテゴリはフラット4つ（Tops / Bottoms / Outerwear / Accessories、各 3〜6 点）
- サイズは S / M / L（アクセサリーは FREE 単一）。バリアント UI はサイズセレクタ + 単一 `ADD TO CART`（色展開時のみ色スウォッチ）
- 商品詳細に size_chart(jsonb) / material / care / origin / product_code
- 管理者ページは Next.js 自作 `/admin`、Laravel に `/api/admin/*`、`users.role` で認可
- 商品画像は private バケット（S3互換）+ Next.js `/media/[...key]` プロキシ。ローカルは MinIO
- 在庫ステータス 0=SOLD OUT / 1〜3=LOW STOCK / 4+=在庫あり（閾値 config）
- カートはサーバー保持せずフロントのみ（`POST /api/orders` で一括送信）
- 認証は BFF。Laravel は原則非公開（R3 の例外は Stripe Webhook の1本のみ）
- 住所は注文時にスナップショットコピー
- 送料: 一律 ¥800、¥20,000 以上で無料
- お気に入り・検索・レビュー・クーポン・ゲスト注文は作らない
- Laravel 設計: 薄い Controller + Action（1ユースケース1クラス `execute()`）。Service は外部システムのラッパーのみ。Repository 不採用
- ヘッダーはロゴ + ACCOUNT/CART のみ。`/about` は独立ページを持たずトップに統合
- 配色4色・モノトーン・ダークモードなし・影を使わない

### R3 での新しい決定（R2 から変更）

1. **決済 = Stripe（test mode）**。注文フローを分離: `POST /api/orders`（`pending` 作成・在庫引き当て）→ `POST /api/checkout/payment-intent` → フロントで Payment Element 確定 → **Webhook `payment_intent.succeeded` が唯一の "支払い成立" 判断**。フロントの confirmPayment 成功だけでは `paid` にしない。詳細 `docs/09`。
2. **注文ステータス state machine 拡張**: `pending → paid → shipped → completed` ＋ `cancelled`（在庫復元 / paid からは Stripe 返金）。`OrderStatus` Enum に `canTransitionTo()`、副作用は `TransitionOrderStatus` Action。`orders_status_check` を貼り直し。詳細 `docs/02`。
3. **トランザクションメール**: メール認証 / パスワードリセット / 注文確認 / 発送通知。Markdown Mailable + キュー。ローカル Mailpit / 本番 Resend。詳細 `docs/10`。
4. **キュー導入**（R2 は明示的に不採用）。`QUEUE_CONNECTION=database` + `queue:work` を専用サービス（compose の `queue` / 本番は backend 複製 + Start Command 上書き）。載せるのはメール送信のみ。**Redis は検討したが見送り**（`docs/00` に理由。カタログキャッシュは ISR に寄せたので Laravel 側のタグ付きキャッシュが不要、レートリミッタ・キューは `database` で足りる）。
5. **メール認証 + パスワードリセットのフロー実装**（R2 は `email_verified_at` 列だけ存在）。検証 / リセットリンクはフロントのパスを指し、BFF が Laravel へ中継。注文確定（`POST /api/orders`）のみ `verified` ミドルウェアでガード（体験を止めすぎない）。
6. **ISR + `revalidateTag`**（R2 は全ルート `no-store`）。カタログ読み取り（`getProducts` / `getProduct` / `getCategories`）と CMS（`getContent`）にタグ付きキャッシュ。管理側の更新時に BFF Route Handler から `revalidateTag()`。タグ設計は `docs/08` §3.2。
7. **軽量 CMS**。トップの Hero / Concept / Lookbook / About を `/admin/content` から編集。`site_contents`（key + jsonb）。画像は既存プロキシを流用。詳細 `docs/11`。
8. **テスト = Pest 3**（R2 は phpunit のまま未記述）。Feature 中心 + 純粋ロジックの Unit。**Step ごとに機能と並行して書く**。詳細 `docs/12`。
9. **本番デプロイ = Railway**（Docker）。services: frontend / backend / queue / postgres / bucket。backend は Stripe Webhook のため公開ドメインを付ける（署名検証で保護）。詳細 `docs/04`。

### R2 で詰まった点（R3 で最初から回避する）

- BFF Route Handler の GET ハンドラ書き忘れ → 新規 route.ts 実装のたび「`refetch()` の URL ⇄ 実装済みメソッド」を突き合わせる
- マイグレーションのファイル名ソート順で FK エラー（`product_images` < `products`）→ タイムスタンプを手で依存順に（`docs/02`）
- Postgres の NULL 複合 UNIQUE が効かない → 通常 UNIQUE + 部分 UNIQUE インデックスの2本立て
- Next.js dev サーバーのコンパイル待ちフレーク（「操作は成功しているのに画面が古い」）→ 確認は「待ち時間を伸ばす / curl で直接 / DB を直接」で切り分け
- CDP のモバイル幅スクショは `Emulation.setDeviceMetricsOverride`（`--window-size` は効かない）
- ダミー画像（1x1 の最小 JPEG）が Chrome のデコーダーで無効扱い → 有効な JPEG を使う
- `Model::preventLazyLoading` は複数行結果にしか効かない → 詳細ページの `with` は手を抜かない
- `serversideup/php:8.4-fpm-nginx` に intl / gd / bcmath 非同梱 → R3 でも未使用

**R4 以降に回すもの**（今は線を引く）
- 注文ステータスの追跡番号・配送業者連携
- 部分返金、複数配送先、返品 RMA
- 多言語 / 多通貨
- CMS のリッチ化（ページ追加・ブロック自由配置・下書き/公開・履歴）
- 監視 / SLO / 負荷試験 / 法務・コンプラ
- CI の本格整備（Phase 11 で最小限は入れる）

---

## 実装ログ

（Step ごとにここへ追記する。フォーマットは R2 に倣う: 狙い → やったこと → 確認 → 詰まった点）

### Phase 0 — R3 設計ドキュメント（2026-09-07）

- `docs/00`〜`12` を R3 版として新規作成。R2 の構成を踏襲しつつ、決済・メール・キュー・state machine・ISR・CMS・テストの節を追加
- 新規ドキュメント: `09-payments-stripe.md` / `10-email.md` / `11-cms.md` / `12-testing.md`
- 計画ファイル: `~/.claude/plans/playful-skipping-pascal.md`
