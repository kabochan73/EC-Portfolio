"use client";

import { useState } from "react";

import ContentImageUpload from "@/components/admin/content/ContentImageUpload";
import Field from "@/components/ui/Field";
import { heroSchema } from "@/lib/schemas/adminContent";
import type { SiteContent } from "@/lib/types";

export default function HeroSection({ initial }: { initial: SiteContent["hero"] }) {
  const [headline, setHeadline] = useState(initial.headline);
  const [tagline, setTagline] = useState(initial.tagline);
  const [imageUrl, setImageUrl] = useState<string | null>(initial.image_url);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    setNotice(null);

    const parsed = heroSchema.safeParse({ headline, tagline, image_url: imageUrl });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "入力を確認してください。");
      return;
    }

    setSaving(true);
    const res = await fetch("/bff/admin/content/hero", {
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
    <div className="space-y-5">
      <Field
        label="Headline"
        id="hero-headline"
        value={headline}
        onChange={(e) => setHeadline(e.target.value)}
      />
      <Field
        label="Tagline"
        id="hero-tagline"
        value={tagline}
        onChange={(e) => setTagline(e.target.value)}
      />
      <ContentImageUpload
        contentKey="hero"
        value={imageUrl}
        onChange={setImageUrl}
        label="Background Image（任意）"
      />

      {error && <p className="text-xs text-graphite">{error}</p>}
      {notice && <p className="text-xs text-graphite">{notice}</p>}

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="bg-ink px-6 py-3 text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {saving ? "..." : "Save Hero"}
      </button>
    </div>
  );
}
