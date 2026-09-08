import type { Metadata } from "next";

import ContentEditor from "@/components/admin/ContentEditor";
import { fetchAdminContent } from "@/lib/admin/content";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin Content" };

export default async function AdminContentPage() {
  const { token } = await requireAdmin("/admin/content");
  const content = await fetchAdminContent(token);

  return (
    <div>
      <h1 className="mb-2 text-xl tracking-widest uppercase">Content</h1>
      <p className="mb-8 text-[11px] tracking-widest text-graphite uppercase">
        トップページの表示内容。保存すると即時反映されます。
      </p>
      <ContentEditor initial={content} />
    </div>
  );
}
