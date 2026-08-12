<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Crypt;

class SmtpSettings {
  public static function read(): array {
    return Cache::remember('smtp_settings', 60, function () {
      $rows = Setting::where('category', 'mail')->pluck('value', 'key');
      return [
        'host'       => $rows['host']       ?? '',
        'port'       => (int)($rows['port'] ?? 587),
        'encryption' => $rows['encryption'] ?? 'tls',
        'username'   => $rows['username']   ?? '',
        'password'   => self::decrypt($rows['password'] ?? ''),
        'from_address'=> $rows['from_address'] ?? config('mail.from.address'),
        'from_name'   => $rows['from_name']     ?? config('mail.from.name'),
        'timeout'     => (int)($rows['timeout'] ?? 30),
      ];
    });
  }

  public static function isConfigured(): bool {
    $s = self::read();
    return filled($s['host']) && filled($s['username']) && filled($s['password']) && filled($s['from_address']);
  }

  public static function apply(): void {
    $s = self::read();
    Config::set('mail.default', 'smtp');
    Config::set('mail.mailers.smtp', array_merge(config('mail.mailers.smtp', []), [
      'transport' => 'smtp',
      'host' => $s['host'],
      'port' => $s['port'],
      'encryption' => $s['encryption'] === 'none' ? null : $s['encryption'],
      'username' => $s['username'],
      'password' => $s['password'],
      'timeout' => $s['timeout'],
    ]));
    Config::set('mail.from.address', $s['from_address']);
    Config::set('mail.from.name', $s['from_name']);
  }

  public static function bust(): void { 
      Cache::forget('smtp_settings'); 
  }

  private static function decrypt(?string $value): string {
      if (empty($value)) {
          return '';
      }
      try {
          return Crypt::decryptString($value);
      } catch (\Exception $e) {
          return $value; // Fallback to plaintext if decryption fails (e.g. legacy data)
      }
  }
}
