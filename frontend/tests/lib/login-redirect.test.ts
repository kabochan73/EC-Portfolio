import { describe, expect, it } from "vitest";

import { resolveLoginRedirect } from "@/lib/login-redirect";

describe("resolveLoginRedirect", () => {
  it("sends an admin to the admin panel when there is no redirect", () => {
    expect(resolveLoginRedirect(null, "admin")).toBe("/admin");
  });

  it("sends a customer to the account page when there is no redirect", () => {
    expect(resolveLoginRedirect(null, "customer")).toBe("/account");
  });

  it("honours an in-site redirect for both roles", () => {
    expect(resolveLoginRedirect("/admin/orders/EC-1", "admin")).toBe(
      "/admin/orders/EC-1",
    );
    expect(resolveLoginRedirect("/checkout", "customer")).toBe("/checkout");
  });

  it("ignores redirects that leave the site", () => {
    expect(resolveLoginRedirect("https://evil.example", "customer")).toBe(
      "/account",
    );
    expect(resolveLoginRedirect("//evil.example", "customer")).toBe("/account");
    expect(resolveLoginRedirect("/\\evil.example", "admin")).toBe("/admin");
  });
});
