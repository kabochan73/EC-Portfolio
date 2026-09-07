<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
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
        $isProduction = $this->app->environment('production');
        Model::preventLazyLoading(! $isProduction);
        Model::preventSilentlyDiscardingAttributes(! $isProduction);

        // ログイン試行のレート制限（メール + IP で 5 回/分）。routes で throttle:login。
        RateLimiter::for('login', function (Request $request) {
            $email = (string) $request->input('email');

            return Limit::perMinute(5)->by(mb_strtolower($email).'|'.$request->ip());
        });
    }
}
