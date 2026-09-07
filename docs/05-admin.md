# 管理者ページ設計（R3）

方式: **Next.js に自作の `/admin`**（フロントと同じ技術・デザイン）。Laravel には管理用 API `/api/admin/*`。

## 認可

- `users.role`（`customer` / `admin`、default `customer`）。シーダーで管理者1人
- `GET /api/me` は `role` と `email_verified` を返す
- Next.js: `middleware.ts` で `/admin/*` を Cookie 有無だけチェック。実 role 確認は Server Component の `requireAdmin()`（`role !== 'admin'` なら `/` へ）
- Laravel: `/api/admin/*` は `auth:sanctum` + `admin` ミドルウェア（`EnsureAdmin`、`$user->role === UserRole::Admin`）。認証済みだが権限なしは 403
- ログインは通常の `/login` を共用

## 画面（Next.js ルート）

| パス | 内容 |
|---|---|
| `/admin` | ダッシュボード（注文件数・売上・在庫僅少/切れの商品数・最近の注文5件） |
| `/admin/products` | 商品一覧（未公開含む、検索・カテゴリ絞り込み・ページング） |
| `/admin/products/new` | 商品新規作成 |
| `/admin/products/[id]` | 商品編集（基本情報／画像／バリアント／公開フラグ） |
| `/admin/categories` | カテゴリ一覧・追加・編集・並べ替え |
| `/admin/orders` | 注文一覧（ステータスフィルタ・ページング） |
| `/admin/orders/[number]` | 注文詳細・ステータス変更（フルフィルメント） |
| `/admin/customers` | 会員一覧（閲覧のみ、注文数・登録日、名前/メール検索） |
| `/admin/content` | **CMS（R3 追加）**。トップの Hero / Concept / Lookbook / About を編集 |

管理画面はモノトーンだが装飾を排し、機能優先のテーブル/フォームレイアウト。ストアフロントの Header/Footer は持たず、専用サイドバー（Dashboard / Products / Categories / Orders / Customers / Content / My Account）。

### 商品編集ページ

1. **基本情報**: name / slug / category / price / description / material / care / origin / product_code / size_chart（列名＋各サイズの数値をカンマ区切りテキストで編集する簡易版。R2 の判断を踏襲）/ is_published / position
2. **画像**: アップロード（multipart）、サムネ一覧、並べ替え（position）、削除。position 0 = 主画像・1 = ホバー画像。保存系操作後に BFF が `revalidateTag('products')` と `revalidateTag('product:{slug}')`
3. **バリアント**: S/M/L（アクセサリーは FREE）の行。color（任意）/ sku / stock。size は新規作成時のみ選択可、編集時は読み取り専用

### 注文詳細ページ（R3 でフルフィルメント対応）

- 配送先スナップショット / 明細 / 送料 / 合計 / 注文日時 / 顧客（name / email）
- 決済情報: `payment.status` / `stripe_payment_intent_id`（表示のみ）/ `last_error`
- ステータス操作（現在値に応じてボタンを出し分け。`docs/02` の state machine）:
  - `pending`: `CANCEL ORDER`（在庫復元）
  - `paid`: `MARK AS SHIPPED` / `CANCEL & REFUND`（在庫復元 + Stripe 返金）
  - `shipped`: `MARK AS COMPLETED` / `CANCEL`（返品扱い、在庫は戻さない）
  - `completed` / `cancelled`: 操作なし
- 不正遷移は API が 422。フロントはボタンで既に絞っているが、二重送信対策として楽観ロックはせず「操作後に再取得」

### CMS 編集ページ（`/admin/content`。R3 追加）

`docs/11-cms.md` に詳細。4 セクションをタブ or アコーディオンで:
- **Hero**: headline / tagline（テキスト）+ 背景画像（1枚アップロード）
- **Concept**: body（複数行テキスト）
- **Lookbook**: 画像リスト（追加・削除・並べ替え。5〜6枚想定）
- **About**: ブロックの配列（label / heading / body / 画像1枚）。3ブロック想定

保存 = `PUT /api/admin/content/{key}`（画像は先に `POST /api/admin/content/{key}/images` でアップロードして URL を得てから）。成功後 BFF が `revalidateTag('content')`。

## Laravel 管理 API（`/api/admin`、要 admin）

### ダッシュボード
| メソッド | パス | 返却 |
|---|---|---|
| GET | `/api/admin/stats` | `{ orders_count, revenue_total, pending_count, low_stock_count, sold_out_count, recent_orders: [...] }`。`revenue_total` = `status IN (paid, shipped, completed)` の `total` 合計（R3 で復活。R2 は決済が無く意味のない数字なので出さなかった） |

### 商品
| メソッド | パス | 備考 |
|---|---|---|
| GET | `/api/admin/products` | 未公開含む。`?q=&category=&page=` |
| POST | `/api/admin/products` | 作成 |
| GET | `/api/admin/products/{id}` | 編集用フル情報（images/variants 込み） |
| PUT | `/api/admin/products/{id}` | 基本情報更新 |
| DELETE | `/api/admin/products/{id}` | 削除（`order_items.product_id` は SET NULL） |

### 商品画像
| メソッド | パス | 備考 |
|---|---|---|
| POST | `/api/admin/products/{id}/images` | multipart。バケット保存 + 行作成 |
| PUT | `/api/admin/products/{id}/images/reorder` | `{ order: [imageId, ...] }` |
| DELETE | `/api/admin/product-images/{id}` | バケットのオブジェクトも削除 |

### バリアント
| メソッド | パス | 備考 |
|---|---|---|
| POST | `/api/admin/products/{id}/variants` | `{ size, color?, sku, stock }` |
| PUT | `/api/admin/variants/{id}` | `{ color?, sku, stock }`（size 変更不可） |
| DELETE | `/api/admin/variants/{id}` | 注文で参照済みは SET NULL |

### カテゴリ
| メソッド | パス |
|---|---|
| GET / POST | `/api/admin/categories` |
| PUT / DELETE | `/api/admin/categories/{id}` |
| PUT | `/api/admin/categories/reorder` |

`DELETE` は所属商品がある場合 409（`CategoryInUseException`。DB の RESTRICT に頼らず事前チェック）。

### 注文
| メソッド | パス | 備考 |
|---|---|---|
| GET | `/api/admin/orders` | 全ユーザー。`?status=&page=` |
| GET | `/api/admin/orders/{order_number}` | 明細・配送先・顧客・決済情報 |
| PUT | `/api/admin/orders/{order_number}/status` | `{ status }`。state machine（`docs/02`）。不正遷移 422。`paid → cancelled` は返金 |

### 会員
| メソッド | パス | 備考 |
|---|---|---|
| GET | `/api/admin/customers` | `role='customer'`。注文数・登録日。`?q=`（name/email 部分一致）・`?page=` |

### CMS（R3 追加）
| メソッド | パス | 備考 |
|---|---|---|
| GET | `/api/admin/content` | 全 4 キーの `data`（生 JSON） |
| PUT | `/api/admin/content/{key}` | `data` を差し替え。`updated_by` に現在の admin |
| POST | `/api/admin/content/{key}/images` | multipart。`content/{key}/{ulid}.ext` で保存、`{ url }` を返す |

## 画像ストレージ（Railway バケット）

R2 から不変。
- Railway バケットは private のみ。直リンク不可
- Laravel は Flysystem S3 ドライバ（`config/filesystems.php` の `s3` ディスク）
- キー形式: 商品 `products/{product_id}/{ulid}.{ext}` / CMS `content/{key}/{ulid}.{ext}`
- `product_images.path` はキーを保持。`url` は API リソースが `/media/{path}` として組み立て
- 配信: Next.js `app/media/[...key]/route.ts` が `GetObject` して `Cache-Control: public, max-age=31536000, immutable` で返す
- ローカルは MinIO（`FILESYSTEM_DISK=s3`、エンドポイントを MinIO に、`AWS_USE_PATH_STYLE_ENDPOINT=true`）
- `Services/StorageService`（S3 互換バケットの薄いラッパ。`docs/06` で Service を使う数少ない箇所）
