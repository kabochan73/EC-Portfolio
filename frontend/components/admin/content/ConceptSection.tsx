"use client";

import { useState } from "react";

import { conceptSchema } from "@/lib/schemas/adminContent";
import type { SiteContent } from "@/lib/types";

export default function ConceptSection({ initial }: { initial: SiteContent["concept"] }) {
  const [body, setBody] = useState(initial.body);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    setNotice(null);

    const parsed = conceptSchema.safeParse({ body });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "入力を確認してください。");
      return;
    }

    setSaving(true);
    const res = await fetch("/bff/admin/content/concept", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);

    if (!res.ok) {
      const resBody = await res.json().catch(() => null);
      setError(resBody?.message ?? "保存に失敗しました。");
      return;
    }
    setNotice("保存しました。");
  }

  return (
    <div className="space-y-5">
      <div>
        <label
          htmlFor="concept-body"
          className="block text-[11px] tracking-widest text-graphite uppercase"
        >
          Body（改行で段落）
        </label>
        <textarea
          id="concept-body"
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-2 w-full border border-ink bg-transparent p-2 text-sm outline-none"
        />
      </div>

      {error && <p className="text-xs text-graphite">{error}</p>}
      {notice && <p className="text-xs text-graphite">{notice}</p>}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="bg-ink px-6 py-3 text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {saving ? "..." : "Save Concept"}
      </button>
    </div>
  );
}
