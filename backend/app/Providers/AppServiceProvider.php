<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // 本番以外では N+1（遅延ロード）を即例外にして開発中に気づけるようにする。
        // 注意（R2 の発見）: preventLazyLoading は複数行結果にしか効かない。
        // 単一モデルの遅延アクセスはすり抜けるので、詳細ページの with は手を抜かない。
        Model::preventLazyLoading(! $this->app->isProduction());
        Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());
    }
}
