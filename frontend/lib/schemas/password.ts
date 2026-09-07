import { z } from "zod";

// backend/app/Http/Requests/Auth/UpdatePasswordRequest.php と揃える。
export const passwordSchema = z
  .object({
    current_password: z.string().min(1, "現在のパスワードを入力してください"),
    password: z.string().min(8, "パスワードは8文字以上で入力してください"),
    password_confirmation: z.string().min(1, "確認用パスワードを入力してください"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "パスワードが一致しません",
    path: ["password_confirmation"],
  })
  .refine((data) => data.password !== data.current_password, {
    message: "現在のパスワードとは別のパスワードにしてください",
    path: ["password"],
  });

export type PasswordFormValues = z.infer<typeof passwordSchema>;
