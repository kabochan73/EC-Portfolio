// ─────────────────────────────────────────────────────────────
// Laravel API のレスポンス形と対応する TypeScript 型。
// backend/app/Http/Resources/* の形と 1:1 に揃える（Resource を変えたらここも直す）。
// docs/08-frontend-design.md §7: 1関数専用の入力型も含めて全部このファイルに集約する。
// ─────────────────────────────────────────────────────────────

/** 単体リソース { "data": {...} } */
export type ApiResource<T> = { data: T };

/** 一覧リソース { "data": [...] } */
export type ApiCollection<T> = { data: T[] };

/** ページ付きリソース（Laravel paginate + Resource collection） */
export type ApiPaginated<T> = {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
};

// ── Enums（backend/app/Enums/*）───────────────────────────────

/** backend/app/Enums/StockStatus.php */
export type StockStatus = "sold_out" | "low_stock" | "in_stock";

/** backend/app/Enums/OrderStatus.php */
export type OrderStatus = "pending" | "paid" | "shipped" | "completed" | "cancelled";

// ── カタログ（Resources/Shop/*）──────────────────────────────

// Shop/CategoryResource
export type Category = {
  id: number;
  name: string;
  slug: string;
};

// Shop/ProductImageResource
export type ProductImage = {
  id: number;
  url: string;
  alt: string | null;
  position: number;
};

// Shop/ProductSummaryResource（一覧カード・関連商品で共通）
export type ProductSummary = {
  id: number;
  name: string;
  slug: string;
  price: number;
  category: { name: string; slug: string };
  stock_status: StockStatus;
  is_new: boolean;
  images: ProductImage[];
};

// Shop/ProductVariantResource（公開向け。生の stock は返らない）
export type ProductVariant = {
  id: number;
  size: string;
  color: string | null;
  stock_status: StockStatus;
  stock_label: string;
  selectable: boolean;
};

// docs/02-database-design.md の size_chart JSON フォーマット
export type SizeChart = {
  unit: string;
  columns: string[];
  rows: Record<string, number[]>;
};

// Shop/ProductDetailResource
export type ProductDetail = {
  id: number;
  name: string;
  slug: string;
  price: number;
  category: { name: string; slug: string };
  description: string;
  material: string;
  care: string | null;
  origin: string;
  product_code: string;
  size_chart: SizeChart | null;
  is_new: boolean;
  images: ProductImage[];
  colors: string[];
  variants: ProductVariant[];
  related: ProductSummary[];
};

// カート（Zustand persist）に持つ「追加時点の表示スナップショット」（docs/08 §5）。
// 実際の在庫・価格は /cart・/checkout 表示時に GET /api/cart/validate で再検証する。
export type CartItem = {
  variantId: number;
  productSlug: string;
  productName: string;
  size: string;
  color: string | null;
  unitPrice: number;
  quantity: number;
  imageUrl: string | null;
};

// GET /api/cart/validate の1行（backend/app/Http/Controllers/Api/Shop/CartController）
export type CartLineValidation = {
  variant_id: number;
  available: boolean;
  price?: number;
  stock_status?: StockStatus;
  max_quantity?: number;
  product_name?: string;
  product_slug?: string;
  size?: string;
  color?: string | null;
  image_url?: string | null;
};

// ── CMS（GET /api/content。docs/11-cms.md）───────────────────

export type SiteContent = {
  hero: { headline: string; tagline: string; image_url: string | null };
  concept: { body: string };
  lookbook: { images: { url: string; alt: string }[] };
  about: {
    blocks: { label: string; heading: string; body: string; image_url: string | null }[];
  };
};

// ── 認証・会員（Resources/Account/*）─────────────────────────

// Account/UserResource
export type User = {
  id: number;
  name: string;
  email: string;
  role: "customer" | "admin";
  email_verified: boolean;
};

// Account/AddressResource
export type Address = {
  id: number;
  recipient_name: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line1: string;
  address_line2: string | null;
  phone: string;
  is_default: boolean;
};

// ── 注文（Resources/Order/*）────────────────────────────────

export type ShippingAddressSnapshot = {
  recipient_name: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line1: string;
  address_line2: string | null;
  phone: string;
};

// Order/OrderItemResource
export type OrderItem = {
  id: number;
  product_name: string;
  product_slug: string | null;
  size: string;
  color: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
};

// Order/OrderResource（詳細）
export type OrderDetail = {
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  total: number;
  placed_at: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  cancelled_at: string | null;
  shipping_address: ShippingAddressSnapshot;
  items: OrderItem[];
  payment?: { status: string; last_error: string | null } | null;
};

// Order/OrderListResource（履歴一覧）
export type OrderListItem = {
  order_number: string;
  status: OrderStatus;
  total: number;
  item_count: number;
  placed_at: string | null;
};

// POST /api/checkout/payment-intent
export type PaymentIntentResponse = {
  client_secret: string;
  publishable_key: string;
};

// ── 管理画面（Resources/Admin/*）────────────────────────────

// Admin/OrderListResource（管理向け注文一覧。顧客情報を含む）
export type AdminOrderListItem = {
  order_number: string;
  status: OrderStatus;
  total: number;
  item_count: number;
  customer: { id: number | null; name: string | null; email: string | null };
  placed_at: string | null;
  paid_at: string | null;
};

// GET /api/admin/stats（Admin/DashboardController）
// revenue_total は API には残すが、管理ダッシュボードには表示しない（プロジェクト方針）。
export type DashboardStats = {
  orders_count: number;
  revenue_total: number;
  pending_count: number;
  sold_out_count: number;
  low_stock_count: number;
  recent_orders: AdminOrderListItem[];
};

// Admin/CategoryResource（公開用と違い position と商品数を返す）
export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  position: number;
  products_count: number;
};

// Admin/ProductListResource（未公開含む・在庫合計付き）
export type AdminProductListItem = {
  id: number;
  name: string;
  slug: string;
  price: number;
  category: { id: number; name: string; slug: string };
  is_published: boolean;
  position: number;
  total_stock: number;
  variant_count: number;
};

// Admin/ProductVariantResource（公開側と違い生の stock / sku を返す）
export type AdminProductVariant = {
  id: number;
  size: string;
  color: string | null;
  sku: string | null;
  stock: number;
  position: number;
};

// Admin/ProductResource（編集フォーム用のフル情報）
export type AdminProduct = {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  price: number;
  description: string;
  material: string;
  care: string | null;
  origin: string;
  product_code: string;
  size_chart: SizeChart | null;
  is_published: boolean;
  position: number;
  created_at: string | null;
  images: ProductImage[];
  variants: AdminProductVariant[];
};

// ── 各関数専用の入力型 ──────────────────────────────────────

export type LoginPayload = { email: string; password: string };
export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};
export type UpdateProfilePayload = { name: string; email: string };
export type AdminCategoryPayload = { name: string; slug: string };
export type AdminProductPayload = {
  category_id: number;
  name: string;
  slug: string;
  price: number;
  description: string;
  material: string;
  care?: string | null;
  origin: string;
  product_code: string;
  size_chart?: SizeChart | null;
  is_published: boolean;
  position: number;
};
// size は作成時のみ（更新では変更不可。docs/05-admin.md）
export type CreateVariantPayload = {
  size: "S" | "M" | "L" | "FREE";
  color?: string | null;
  sku: string;
  stock: number;
};
export type UpdateVariantPayload = { color?: string | null; sku: string; stock: number };
export type UpdatePasswordPayload = {
  current_password: string;
  password: string;
  password_confirmation: string;
};
export type AddressPayload = Omit<Address, "id" | "is_default"> & { is_default?: boolean };
export type ForgotPasswordPayload = { email: string };
export type ResetPasswordPayload = {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
};

/** POST /api/orders の body */
export type CreateOrderPayload = {
  items: { variant_id: number; quantity: number }[];
  address_id?: number;
  address?: AddressPayload;
  save_address?: boolean;
};
