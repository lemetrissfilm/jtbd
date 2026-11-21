<?php
/** Restricted same-origin tRPC relay. PHP 8.0+; no credentials in this file. */
declare(strict_types=1);

ini_set('display_errors', '0');
require_once __DIR__ . '/gateway-lib.php';

set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    throw new ErrorException('Gateway runtime failure.', 0, $severity, $file, $line);
});

$context = pskz_error_context($_SERVER['REQUEST_URI'] ?? '');
$slot = null;
try {
    if (!extension_loaded('json') || !extension_loaded('iconv') || !extension_loaded('curl')) {
        pskz_unavailable();
    }
    // Enforce input limits while reading, not after buffering arbitrary bodies.
    $raw = file_get_contents('php://input', false, null, 0, PSKZ_GATEWAY_REQUEST_BYTES + 1);
    if ($raw === false) {
        pskz_unavailable();
    }
    $request = pskz_validate_request($_SERVER, $raw);
    $context = ['batch' => $request['batch'], 'count' => $request['count']];
    $directory = pskz_state_directory(__DIR__);
    pskz_rate_limit($directory, $_SERVER['REMOTE_ADDR'] ?? '', $request['count']);
    $slot = pskz_acquire_slot($directory);
    @set_time_limit(110);
    $response = pskz_forward($request);
} catch (PskzGatewayException $error) {
    $response = pskz_error_response($error->rpcCode, $error->getMessage(), $context['batch'], $context['count']);
    $response['body'] = json_encode($response['body'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
} catch (Throwable $error) {
    // No upstream HTML, PHP paths, exception traces or request bodies exposed.
    $response = pskz_error_response('SERVICE_UNAVAILABLE', 'AI-сервис временно недоступен. Попробуйте позже.', $context['batch'], $context['count']);
    $response['body'] = json_encode($response['body'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
} finally {
    pskz_release_slot($slot);
    restore_error_handler();
}

http_response_code($response['status']);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
if ($response['status'] === 405) {
    header('Allow: POST');
}
if ($response['status'] === 429 || $response['status'] === 503) {
    header('Retry-After: 60');
}
echo $response['body'];
