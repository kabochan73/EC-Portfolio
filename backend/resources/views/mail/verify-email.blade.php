@component('mail::message')
# メールアドレスの確認

{{ $recipientName }} 様

EC-PORTFOLIO へのご登録ありがとうございます。
下のボタンからメールアドレスの確認を完了してください。

@component('mail::button', ['url' => $verifyUrl])
メールアドレスを確認する
@endcomponent

このリンクは 60 分で無効になります。
心当たりがない場合はこのメールを破棄してください。

EC-PORTFOLIO
@endcomponent
