import "@testing-library/jest-dom/vitest";

import { createElement, type ReactNode } from "react";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

// next/link / next/image は Next ランタイム前提なので、テストでは素の要素に置き換える。
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: unknown }) =>
    createElement("a", { href: typeof href === "string" ? href : "#", ...props }, children),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    sizes?: string;
    priority?: boolean;
  }) => {
    void props.fill;
    void props.sizes;
    void props.priority;
    return createElement("img", { src, alt });
  },
}));
