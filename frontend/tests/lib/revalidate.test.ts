import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidateTag = vi.fn();
vi.mock("next/cache", () => ({
  revalidateTag: (...args: unknown[]) => revalidateTag(...args),
}));

// モックを貼ってから import する
const { revalidate, revalidateSeconds, tags } = await import("@/lib/revalidate");

beforeEach(() => {
  revalidateTag.mockReset();
});

describe("tags", () => {
  it("固定タグは文字列", () => {
    expect(tags.products).toBe("products");
    expect(tags.categories).toBe("categories");
    expect(tags.content).toBe("content");
  });

  it("product(slug) は product:{slug}", () => {
    expect(tags.product("boxy-cotton-t-shirt")).toBe("product:boxy-cotton-t-shirt");
  });

  it("revalidateSeconds は全キー正の数", () => {
    for (const v of Object.values(revalidateSeconds)) {
      expect(v).toBeGreaterThan(0);
    }
  });
});

describe("revalidate()", () => {
  it("渡したタグそれぞれで revalidateTag を呼ぶ", () => {
    revalidate(tags.products, tags.product("x"));
    expect(revalidateTag).toHaveBeenCalledTimes(2);
    expect(revalidateTag).toHaveBeenNthCalledWith(1, "products");
    expect(revalidateTag).toHaveBeenNthCalledWith(2, "product:x");
  });

  it("revalidateTag が投げても呼び出し全体は落とさない", () => {
    revalidateTag.mockImplementation(() => {
      throw new Error("no store");
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => revalidate("products", "content")).not.toThrow();
    expect(revalidateTag).toHaveBeenCalledTimes(2); // 1つ目が投げても2つ目も試みる

    errorSpy.mockRestore();
  });
});
