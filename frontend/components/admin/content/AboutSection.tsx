"use client";

import { useState } from "react";

import ContentImageUpload from "@/components/admin/content/ContentImageUpload";
import Field from "@/components/ui/Field";
import { aboutSchema } from "@/lib/schemas/adminContent";
import type { SiteContent } from "@/lib/types";

type AboutBlock = SiteContent["about"]["blocks"][number];

const EMPTY_BLOCK: AboutBlock = { label: "", heading: "", body: "", image_url: null };

export default function AboutSection({ initial }: { initial: SiteContent["about"] }) {
  const [blocks, setBlocks] = useState<AboutBlock[]>(initial.blocks);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update(index: number, patch: Partial<AboutBlock>) {
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    setBlocks((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function save() {
    setError(null);
    setNotice(null);

    const parsed = aboutSchema.safeParse({ blocks });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "入力を確認してください。");
      return;
    }

    setSaving(true);
    const res = await fetch("/bff/admin/content/about", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "保存に失敗しました。");
      return;
    }
    setNotice("保存しました。");
  }

  return (
    <div className="space-y-8">
      {blocks.map((block, index) => (
        <div key={index} className="space-y-4 border border-mist p-4">
          <div className="flex justify-between text-xs">
            <span className="tracking-widest text-graphite uppercase">Block {index + 1}</span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="disabled:opacity-30"
                aria-label="前へ"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === blocks.length - 1}
                className="disabled:opacity-30"
                aria-label="後ろへ"
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => setBlocks((prev) => prev.filter((_, i) => i !== index))}
                className="tracking-widest text-graphite uppercase underline underline-offset-2 hover:text-ink"
              >
                Remove
              </button>
            </div>
          </div>

          <Field
            label="Label"
            id={`about-label-${index}`}
            value={block.label}
            onChange={(e) => update(index, { label: e.target.value })}
          />
          <Field
            label="Heading"
            id={`about-heading-${index}`}
            value={block.heading}
            onChange={(e) => update(index, { heading: e.target.value })}
          />
          <div>
            <label
              htmlFor={`about-body-${index}`}
              className="block text-[11px] tracking-widest text-graphite uppercase"
            >
              Body
            </label>
            <textarea
              id={`about-body-${index}`}
              rows={3}
              value={block.body}
              onChange={(e) => update(index, { body: e.target.value })}
              className="mt-2 w-full border border-ink bg-transparent p-2 text-sm outline-none"
            />
          </div>
          <ContentImageUpload
            contentKey="about"
            value={block.image_url}
            onChange={(url) => update(index, { image_url: url })}
            label="Image（任意）"
          />
        </div>
      ))}

      {blocks.length < 6 && (
        <button
          type="button"
          onClick={() => setBlocks((prev) => [...prev, { ...EMPTY_BLOCK }])}
          className="border border-ink px-6 py-3 text-xs tracking-widest uppercase transition-colors hover:bg-mist"
        >
          Add Block
        </button>
      )}

      {error && <p className="text-xs text-graphite">{error}</p>}
      {notice && <p className="text-xs text-graphite">{notice}</p>}

      <div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="bg-ink px-6 py-3 text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {saving ? "..." : "Save About"}
        </button>
      </div>
    </div>
  );
}
