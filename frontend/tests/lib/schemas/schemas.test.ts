import { describe, expect, it } from "vitest";

import { addressSchema } from "@/lib/schemas/address";
import { adminProductSchema } from "@/lib/schemas/adminProduct";
import { passwordSchema } from "@/lib/schemas/password";

const validAddress = {
  recipient_name: "久保 拓海",
  postal_code: "150-0001",
  prefecture: "東京都",
  city: "渋谷区",
  address_line1: "神宮前1-2-3",
  address_line2: "",
  phone: "09012345678",
};

describe("addressSchema", () => {
  it("正しい住所は通る", () => {
    expect(addressSchema.safeParse(validAddress).success).toBe(true);
  });

  it("郵便番号はハイフン区切り必須", () => {
    const r = addressSchema.safeParse({ ...validAddress, postal_code: "1500001" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].path).toEqual(["postal_code"]);
    }
  });

  it("宛名は空だと落ちる", () => {
    expect(addressSchema.safeParse({ ...validAddress, recipient_name: "" }).success).toBe(false);
  });

  it("建物名は空文字を許容", () => {
    expect(addressSchema.safeParse({ ...validAddress, address_line2: "" }).success).toBe(true);
  });
});

describe("passwordSchema", () => {
  const base = {
    current_password: "oldpassword",
    password: "newpassword",
    password_confirmation: "newpassword",
  };

  it("正しい入力は通る", () => {
    expect(passwordSchema.safeParse(base).success).toBe(true);
  });

  it("新パスワードと確認が不一致だと password_confirmation にエラー", () => {
    const r = passwordSchema.safeParse({ ...base, password_confirmation: "different" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("password_confirmation"))).toBe(true);
    }
  });

  it("新パスワードが現在と同じだと password にエラー", () => {
    const r = passwordSchema.safeParse({
      current_password: "samepass1",
      password: "samepass1",
      password_confirmation: "samepass1",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("password"))).toBe(true);
    }
  });

  it("新パスワードは8文字未満で落ちる", () => {
    expect(
      passwordSchema.safeParse({ ...base, password: "short", password_confirmation: "short" }).success,
    ).toBe(false);
  });
});

describe("adminProductSchema", () => {
  const validProduct = {
    category_id: 1,
    name: "Boxy Cotton T-Shirt",
    slug: "boxy-cotton-t-shirt",
    price: 12000,
    description: "説明",
    material: "綿100%",
    care: "",
    origin: "日本",
    product_code: "EC-TO0001",
    is_published: true,
    position: 0,
  };

  it("正しい商品は通る", () => {
    expect(adminProductSchema.safeParse(validProduct).success).toBe(true);
  });

  it("slug に大文字が入ると落ちる", () => {
    expect(adminProductSchema.safeParse({ ...validProduct, slug: "Boxy-Cotton" }).success).toBe(false);
  });

  it("price 0 は落ちる", () => {
    expect(adminProductSchema.safeParse({ ...validProduct, price: 0 }).success).toBe(false);
  });

  it("price は文字列を数値に coerce する", () => {
    const r = adminProductSchema.safeParse({ ...validProduct, price: "12000" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.price).toBe(12000);
  });
});
