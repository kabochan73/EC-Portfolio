<?php

/*
|--------------------------------------------------------------------------
| 管理者アカウント（AdminUserSeeder が使う）
|--------------------------------------------------------------------------
| 認証情報は .env に置き、リポジトリには入れない。未設定ならローカル用の
| デフォルトにフォールバックする。config 経由で読むこと（本番は config:cache
| が効くので seeder 内の env() は null になる）。
*/

return [
    'name' => env('ADMIN_NAME', 'Store Admin'),
    'email' => env('ADMIN_EMAIL', 'admin@ec-portfolio.example.jp'),
    'password' => env('ADMIN_PASSWORD', 'password'),
];
