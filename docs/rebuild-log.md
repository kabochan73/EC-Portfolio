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
- 在庫ステータス 0=SOLD OUT / LOW STOCK / 在庫あり（閾値は `config('shop.low_stock_threshold')`。R3 は 5）
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
- コミット方針: 1コミット＝小さい単位、**コミット前にユーザーがコードをレビューして承認**、push はユーザー（remote `github.com/kabochan73/EC-Portfolio`）

---

## 環境構築フェーズ（Step 1〜6）

**Step 1 — 2026-09-07 リポジトリ骨組み**
- `git init`（`main`）。`.gitignore`（ec2 踏襲）/ `.editorconfig`（2スペース、PHP 4）/ `.nvmrc`（22）/ `README.md`（R3 のゴール表・Mailpit 追記）
- コミットを docs（`74c9ac8`）と骨組み（`8594dff`）で分割

**Step 2 — 2026-09-07 ローカルインフラ（db / minio / mailpit）**
- `docker-compose.yml`: `db`（postgres:16-alpine、`ecp`）/ `minio` + `createbuckets`（`ec-portfolio-media` を private で自動作成）/ `mailpit`（R3 追加。SMTP 受信箱、Web UI :8025）
- backend / frontend / queue は Step 3 以降で段階的に追加
- 確認: `docker compose up -d` で db・minio・mailpit が healthy、`pg_isready` OK、バケット作成成功、Mailpit UI 応答

**Step 3 — 2026-09-07 backend（Laravel 12）+ Postgres 疎通**
- `composer create-project laravel/laravel:^12`（使い捨て `composer:2` コンテナ）→ `backend/`（v12.69.1）
- `docker-compose.yml` に `backend`（`serversideup/php:8.4-fpm-nginx` 直接使用、`./backend` マウント、`SSL_MODE=off` / `PHP_OPCACHE_ENABLE=0` / `AUTORUN_ENABLED=false`、8000→8080）
- `backend/.env`（と `.env.example`）を Postgres / MinIO / Mailpit / Stripe プレースホルダに設定。`APP_LOCALE=ja` / `SESSION_DRIVER=array` / `QUEUE_CONNECTION=database`
- `php artisan install:api` で Sanctum v4、`User` に `HasApiTokens`
- `GET /api/health`（DB 接続チェック込み）。`install:api` の migrate が Postgres に成功 = DB 疎通
- 確認: `curl localhost:8000/api/health` → `status ok` / `database ok`、pint パス
- serversideup 同梱拡張: `pdo_pgsql` / `redis` あり、`intl` / `gd` / `bcmath` なし（R3 でも未使用）

**Step 4 — 2026-09-07 frontend（Next.js 15）+ 確定ライブラリ + Stripe**
- `create-next-app@15`（使い捨て `node:22-alpine`、`--skip-install`）→ `frontend/`（Next 15.5.25 / React 19.1、App Router、TS、Tailwind v4、no src dir、turbopack、eslint）
- 確定ライブラリ（zustand / @tanstack/react-query / react-hook-form + @hookform/resolvers + zod / @aws-sdk/client-s3 / lucide-react）＋ **R3 追加**: @stripe/stripe-js（9.15）/ @stripe/react-stripe-js（6.9）
- `package.json` に `engines: node >=22 <23`、`frontend/.nvmrc`、`next.config.ts` に `output: 'standalone'`
- `frontend/Dockerfile.dev`（node:22-alpine、起動時 `npm install && npm run dev`）
- `docker-compose.yml` に `frontend`（`./frontend` マウント、`node_modules` / `.next` は名前付きボリューム隔離、polling 有効、3000 公開）
- 確認: `curl localhost:3000` → 200、コンテナ内 `tsc --noEmit` / `lint` パス
- 既知: next 内蔵 postcss の audit 警告（source map 系）。修正は Next 16 強制のため保留（未信頼 CSS を扱わない。ec2 と同判断）

**Step 5 — 2026-09-07 queue worker サービス**
- `docker-compose.yml` に `queue`（backend と同イメージ・同コード、`command` を `queue:work --tries=3 --sleep=3 --max-time=3600` に上書き）
- serversideup は `command` 上書き時に nginx/php-fpm を起動せず worker のみ動かす。既定 healthcheck は web サーバーを見るので `pgrep -f 'queue:work'` に差し替え
- `AUTORUN_ENABLED=false`（migrate/config:cache は backend 側が1回やる）
- 確認: `queue:work` が PID 1、healthcheck healthy、DB queue へ投入したジョブを `--tries=3` で処理

**Step 6 — 2026-09-07 Pest 導入 + BFF 疎通**
- backend: `pestphp/pest`（3.8）+ `pest-plugin-laravel`（3.2）。`tests/Pest.php`（Feature に `RefreshDatabase`、Unit は TestCase のみ）
- **テストは実 Postgres（`ecp_test`）で回す**（sqlite では partial unique index / jsonb / CHECK を再現できない。R2 の反省）。`phpunit.xml` を pgsql・`ecp_test` に。`backend/database/init/01-create-test-db.sql` を db の `/docker-entrypoint-initdb.d` にマウント（空ボリューム時に自動作成）
- `tests/Feature/Health/HealthTest.php`。Example テスト2本は削除
- frontend: `lib/api.ts`（`apiFetch` / `ApiError` / `apiErrorResponse`、サーバー専用、ec2 踏襲）。`app/bff/health/route.ts`（ブラウザ → Next → Laravel → PG、上流エラー 502）
- 確認: `php artisan test` → 1 passed（Postgres 実行）、`curl localhost:3000/bff/health` → `status ok` / `database ok`、`tsc` / `lint` / `pint` パス

### 環境構築フェーズ 完了（Step 1〜6）
`docker compose up -d` だけで「ブラウザ → Next.js → Laravel → PostgreSQL」＋ MinIO / Mailpit / queue worker が動く。次から機能実装（DB マイグレーション設計 → 公開カタログ API…）。

---

## 機能実装フェーズ（バックエンド）

### Phase 2 — DB / モデル / 公開カタログ API（Step 7〜12）

**Step 7 — 2026-09-07 DB マイグレーション + Enums + config**
- マイグレーション11本を依存順にタイムスタンプ手動調整（`2026_09_07_100000`〜`100100`）。R2 の FK ソート順の罠を回避
- `product_variants` の NULL 複合 UNIQUE は部分 UNIQUE インデックス2本立て（`WHERE color IS NOT NULL` / `IS NULL`）
- CHECK 制約: `price>0` / `stock>=0` / `quantity>0` / `orders_status_check`
- R3 追加テーブル: `payments`（order と1:1）/ `stripe_events`（Webhook 冪等性台帳）/ `site_contents`（CMS）
- Enums: `UserRole` / `StockStatus`（`fromStock`・`label`・`selectable`）/ `OrderStatus`（`transitions`・`canTransitionTo`、副作用は持たない）
- config: `shop.php` 新規、`services.php` に stripe、`app.php` に `frontend_url`
- **`low_stock_threshold` はユーザー指定で 5**（docs 01/02/03/06 も同期）
- 確認: `migrate` / `migrate:fresh` ともゼロから成功、部分 UNIQUE 2本・CHECK 4本を psql で確認

**Step 8 — 2026-09-07 Models + Factories + Seeders + Enum の Unit テスト**
- Model 10種（リレーション・スコープ・キャスト）。`Order` は `OrderStatus` キャスト + `order_number` ルートキー、`StripeEvent` は `claim`/`complete`、`SiteContent` は `defaults()` で4セクションの初期 JSON
- `AppServiceProvider` に `preventLazyLoading`（非本番）。R2 の「単一モデルではすり抜ける」注意をコメント
- Factory 全10モデル（状態メソッド付き）。`OrderItemFactory` の `image_url` は空文字既定（R2 の宿題）
- Seeder: Admin / Category(4) / SiteContent(4) / Product(**14商品・48バリアント**、画像なし・冪等)
- Unit: `StockStatusTest`（境界。閾値5）、`OrderStatusTransitionTest`（遷移マトリクス）
- 確認: `migrate:fresh --seed` 成功、Factory スモークテスト、`php artisan test` 22 passed
- 反省（ユーザー指摘）: 1コミット29ファイルは多すぎた。以降 Models/Factories/Seeders のような塊は分ける。次 Step に進む前に内容を説明して確認を取る

**Step fix — 2026-09-07 テストが開発 DB を作り直す問題を修正**
- `docker-compose.yml` の backend/queue に `env_file: ./backend/.env` を付けていたため `APP_ENV=local` / `DB_DATABASE=ecp` が実コンテナ環境変数になり、`phpunit.xml` の `<env>` でテスト DB を上書きできず、`php artisan test`（RefreshDatabase）が**開発 DB を毎回 migrate:fresh**していた
- `env_file` を外し、Laravel はバインドマウントした `.env` をディスクから読む（ec2 と同じ方式）。テスト DB は `ecp_test` に分離できた

**Step 9 — 2026-09-07 公開カテゴリ API**
- `GET /api/categories` … `Category::ordered()->get()` を `CategoryResource`（`{id,name,slug}` のみ）
- Feature テスト3本（position 順 / 露出項目 / 空リスト）

**Step 10 — 2026-09-07 公開商品一覧 API**
- `GET /api/products` … `published()` のみ・position 順。`?category`（slug、exists 検証）/ `?new`（`Request::boolean` で `true/1/yes` を許容、新着順・30日以内）/ `?limit`（1〜100）
- `ProductSummaryResource`（カード用項目のみ・生の在庫数は返さず全 variant 合算の `stock_status`）、`ProductImageResource`
- 詰まり: `?new=true` が最初 422（Laravel の `boolean` 検証は文字列 `"true"` を弾く）→ `$request->boolean('new')` に
- Feature テスト7本

**Step 11 — 2026-09-07 公開商品詳細 API**
- `GET /api/products/{slug}` … `published()` のみ、未公開・不明 slug は 404
- `ProductDetailResource`（description/material/care/origin/product_code/size_chart/images/colors/variants/related）。`colors` は色付き variant がある時のみ。`related` は同カテゴリの他の公開商品を position 順に全件
- `ProductVariantResource` は公開用（`stock_status`/`stock_label`/`selectable`、生 stock は出さない）
- Feature テスト7本

**Step 12 — 2026-09-07 カート再検証 API**
- `GET /api/cart/validate` … `?variant_ids[]` の配列を受け取り、各 variant の現在価格・`stock_status`・`max_quantity`（`min(stock, cart_max_quantity_per_line)`）・商品情報・主画像 URL を返す。存在しない/非公開商品の variant は `{ variant_id, available:false }`。リクエスト順を保持
- Feature テスト7本

### Phase 2 完了
公開カタログ API（categories / products 一覧・詳細 / cart-validate）が揃った。`php artisan test` 46 passed。次は Phase 3（認証 / 会員 / 住所 / メール認証 / パスワードリセット）。

### Phase 3 — 認証 / 会員 / 住所 / メール認証 / パスワードリセット（Step 13〜17）

**Step 13 — 2026-09-07 認証コア（register / login / logout / me）**
- Sanctum トークン認証。`RegisterUser` / `AuthenticateUser` Action（薄い Controller）
- `register` 201 / `login` 200 は `{ data: user, token }`、`logout` 204
- `AuthenticateUser` はユーザー有無で分岐せず常に `Hash::check` し 422 で存在を秘匿
- `UserResource` は `email_verified` を含む。`login` に `throttle:login`（メール小文字 + IP で 5回/分、`AppServiceProvider` で定義）
- Feature テスト10本

**Step 14 — 2026-09-07 プロフィール更新（PUT /me, /me/password）**
- `UpdateProfile` … 氏名・メール更新。メール変更時は `email_verified_at` を null に戻す
- `UpdatePassword` … `UpdatePasswordRequest` の `current_password` ルール + `different:current_password` + `Password::min(8)`
- `UpdateProfileRequest` は `unique->ignore(self)`
- Feature テスト8本

**Step fix — 2026-09-08 CartValidateApiTest のフレーク修正**
- 同一商品に size 未指定で variant を2つ作っており、部分 UNIQUE `(product_id, size) WHERE color IS NULL` に約1/3で衝突。size を明示

**Step 15 — 2026-09-08 住所録 CRUD**
- `/api/addresses` の index / store / update / destroy / setDefault
- Actions（Create/Update/Delete/SetDefault）はトランザクションで default の一意性を担保: 昇格で他を false 化、default 削除時は残りの直近1件を昇格、既存 default を `is_default=false` 指定では外さない（常に1件）
- 他人の address id は 404 で存在を秘匿。`postal_code` は `123-4567` 形式
- Feature テスト9本

**Step 16 — 2026-09-08 メール認証フロー**
- **Mailable + Job（キュー）を初導入**。`VerifyEmailMail`（Markdown、装飾は Phase 5）、`SendEmailVerificationJob`（`ShouldQueue`、user_id のみ、既認証はスキップ）
- `User::sendEmailVerificationNotification()` を override して Job dispatch。`RegisterUser` / `UpdateProfile`（メール変更時）が呼ぶ
- 検証エンドポイントは `URL::temporarySignedRoute(absolute: false)` の相対署名をフロントのリンクに載せ替え、`signed:relative` ミドルウェアで検証（BFF 中継時のホスト不一致を回避）。`verify` は hash も照合
- 詰まり: queue worker が古いルートを掴んでいて `Route [verification.verify] not defined` で FAIL → `docker compose restart queue` で解消（**worker はコード/ルート変更時に再起動が必要**）
- E2E: `curl register` → worker がジョブ処理 → Mailpit 受信、本文に `http://localhost:3000/verify-email?id=&hash=&expires=&signature=`
- Feature テスト12本

**Step 17 — 2026-09-08 パスワードリセット**
- Laravel `Password` broker を使い、通知だけ自前 Mailable に差し替え（`User::sendPasswordResetNotification` → `SendPasswordResetJob`）
- `sendLink` は常に 200・中立メッセージ（アカウント存在を秘匿）。`reset` は `Password::reset`、失敗は 422 の `email` エラー
- リンクはフロントの `/reset-password?token=&email=`、60分有効
- E2E: `curl /api/forgot-password` → 200、Mailpit に受信
- Feature テスト8本

### Phase 3 完了
認証コア / プロフィール / 住所録 / メール認証 / パスワードリセットが揃った。`php artisan test` 93 passed。次は Phase 4（注文 + Stripe 決済）。

### Phase 4 — 注文 + Stripe 決済（Step 18〜23）

**Step 18 — 2026-09-08 注文の Domain ロジック + 例外**
- `ShippingFeeCalculator`（`>= 20000` で 0、それ以外 800、config 参照、Eloquent 非依存）
- `OrderNumberGenerator`（`EC-YYYYMMDD-NNNN`、当日の最大連番+1、衝突は最大20回リトライ、UNIQUE 制約が最終防衛線）
- `InsufficientStockException` / `UnpublishedProductException`（`render()` で 422）
- Unit テスト（送料の境界、採番の初回/連番/日跨ぎ/飛び番。採番は `uses(RefreshDatabase::class)`）

**Step 19 — 2026-09-08 注文作成 API（POST /api/orders）**
- `CreateOrder` Action: トランザクションで variant を `lockForUpdate`（product + 主画像込み）→ 在庫検証 → 未公開検証 → subtotal をサーバー再計算（**クライアント送信の金額は無視**）→ `orders`(pending) + `order_items` 作成 → 在庫減算 → `save_address` 指定なら addresses にも保存（初回は default）
- DTO 3種（`CreateOrderInput` / `CartLineInput` / `ShippingAddressInput`）。`StoreOrderRequest` は `address_id` を `Rule::exists->where(user_id)`
- `verified` ミドルウェアでメール認証必須
- Feature テスト11本

**Step 20 — 2026-09-08 注文取得 API**
- `GET /api/orders` … `forUser` + `withSum('items','quantity')` + `recentFirst`、`OrderSummaryResource`（`item_count` は quantity 合計）
- `GET /api/orders/{order_number}` … 本人のみ、他人・不明は 404、`items.product:id,slug` + `payment` を eager load
- Feature テスト6本

**Step 21 — 2026-09-08 StripeService + PaymentIntent 作成 API**
- `stripe/stripe-php` 導入。`StripeService`（`StripeClient` ラッパー：`createPaymentIntent` / `retrievePaymentIntent` / `refund` / `constructWebhookEvent`）。`AppServiceProvider` で `StripeClient` を DI（キー未設定でも構築は通す＝空文字ではなく `[]` を渡す）
- `CreatePaymentIntent` Action: pending チェック（非 pending 409）→ キー未設定 503 → **現在のカタログ価格で total 再計算し一致確認**（ズレ 409）→ `payments` 無ければ作成・あれば retrieve（`canceled` なら作り直し）
- `POST /api/checkout/payment-intent`（auth + verified、他人の注文 404）
- `phpunit.xml` に STRIPE ダミーキー。テストは `StripeService` をモック
- Feature テスト8本

**Step 22 — 2026-09-08 Stripe Webhook + 注文確定**
- `POST /api/stripe/webhook`（**認証なし・署名検証のみ・Sanctum の外**）。backend の唯一の公開エンドポイント
- 署名不正 400、`StripeEvent::claim` で冪等（重複 200 no-op、前回失敗の `processed_at` null は再処理可）、処理失敗は 500 で Stripe に再送させる
- `payment_intent.succeeded` → `MarkOrderPaid`: `order_id` で `lockForUpdate`、`pending` 以外は no-op、payment=succeeded + charge_id、order=paid + paid_at、`SendOrderConfirmationJob` dispatch
- `OrderConfirmationMail`（Markdown、明細テーブル）
- `tests/Support/StripeFixtures`（疑似イベント生成、PSR-4）。Feature テスト6本

**Step 23 — 2026-09-08 Webhook の失敗・キャンセル・返金イベント**
- `RestockOrder` Action（明細ごとに `lockForUpdate` + `increment`、削除済み variant はスキップ）
- `HandlePaymentFailed`（`last_error` 更新、注文は pending のまま）/ `CancelOrderPayment`（pending のみ cancelled + cancelled_at + RestockOrder）/ `RecordRefund`（`refunded_at` が null のときだけ、返金追認）
- Feature テスト4本

### Phase 4 完了
注文作成（pending・在庫引き当て）/ 注文取得 / PaymentIntent 作成 / Webhook（succeeded → paid + 確認メール、failed / canceled / refunded）が揃った。`php artisan test` 134 passed。実 Stripe キーでの E2E（`stripe listen`）はキー入手後（ユーザー方針）。次は注文ステータス state machine（admin）+ 管理 API + CMS。
