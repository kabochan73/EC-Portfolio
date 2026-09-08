import { z } from "zod";

// backend/app/Http/Requests/Admin/Variant/{Store,Update}VariantRequest.php と揃える。
// size は新規作成時のみ（更新では変更不可。docs/05-admin.md）。
export const createVariantSchema = z.object({
  size: z.enum(["S", "M", "L", "FREE"]),
  color: z.string().max(30).optional().or(z.literal("")),
  sku: z.string().min(1, "SKU を入力してください").max(40),
  stock: z.coerce.number().int().min(0, "0 以上の整数で入力してください"),
});

export type CreateVariantFormValues = z.infer<typeof createVariantSchema>;
