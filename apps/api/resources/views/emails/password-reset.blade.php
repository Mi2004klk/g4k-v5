@component('mail::message')
# Reset your password

Hello,

We received a request to reset the password for your Games4king Workplace OS account.

@component('mail::button', ['url' => $resetUrl])
Reset Password
@endcomponent

This link expires in **60 minutes**. If you didn't request this, you can safely ignore this email.

@component('mail::subline')
Games4king Workplace OS
@endcomponent
@endcomponent
