<?php
/**
 * PHP 8.0+, ext-curl, ext-json and ext-iconv. No credentials or request logging.
 * This relay protects only itself: the public Manus upstream remains directly
 * accessible and cannot be protected, authenticated or quota-controlled here.
 */
declare(strict_types=1);

const PSKZ_GATEWAY_ORIGIN = 'https://jtbd.mikh.kz';
const PSKZ_GATEWAY_UPSTREAM = 'https://jtbd.manus.space/api/trpc';
const PSKZ_GATEWAY_REQUEST_BYTES = 2097152; // Includes worst-case JSON string escaping.
const PSKZ_GATEWAY_RESPONSE_BYTES = 1048576;
const PSKZ_GATEWAY_PROCEDURES = [
    'ai.chat', 'ai.generateExample', 'ai.generateArtifacts', 'ai.evaluate',
];
const PSKZ_GATEWAY_EXAMPLE_TYPES = [
    'job_story', 'job_chain', 'jtbd_statement', 'synthetic_persona',
    'interview_guide', 'job_map', 'opportunity_score', 'other',
];
const PSKZ_GATEWAY_ERRORS = [
    'PARSE_ERROR' => [-32700, 400],
    'BAD_REQUEST' => [-32600, 400],
    'FORBIDDEN' => [-32003, 403],
    'METHOD_NOT_SUPPORTED' => [-32005, 405],
    'PAYLOAD_TOO_LARGE' => [-32013, 413],
    'UNSUPPORTED_MEDIA_TYPE' => [-32015, 415],
    'TOO_MANY_REQUESTS' => [-32029, 429],
    'SERVICE_UNAVAILABLE' => [-32603, 503],
];

final class PskzGatewayException extends RuntimeException
{
    public string $rpcCode;
    public int $httpStatus;

    public function __construct(string $rpcCode, string $message)
    {
        $this->rpcCode = $rpcCode;
        $this->httpStatus = PSKZ_GATEWAY_ERRORS[$rpcCode][1];
        parent::__construct($message);
    }
}

function pskz_fail(string $message, string $code = 'BAD_REQUEST'): void
{
    throw new PskzGatewayException($code, $message);
}

function pskz_unavailable(): void
{
    pskz_fail('AI-сервис временно недоступен. Попробуйте позже. Если проблема сохраняется, обратитесь к владельцу сайта.', 'SERVICE_UNAVAILABLE');
}

/** Pure formatter: tRPC 11 with SuperJSON; never a successful result envelope. */
function pskz_error_response(string $code, string $message, bool $batch, int $count = 1): array
{
    [$numeric, $status] = PSKZ_GATEWAY_ERRORS[$code];
    $item = ['error' => ['json' => [
        'message' => $message,
        'code' => $numeric,
        'data' => ['code' => $code, 'httpStatus' => $status],
    ]]];
    return ['status' => $status, 'body' => $batch ? array_fill(0, max(1, min(4, $count)), $item) : $item];
}

/** Untrusted hints affect error shape only, never routing or authorization. */
function pskz_error_context(string $uri): array
{
    $parts = explode('?', $uri, 2);
    $batch = preg_match('/(?:^|&)batch=1(?:&|$)/D', $parts[1] ?? '') === 1;
    $count = 1;
    if (preg_match('~\A/api/trpc/([A-Za-z.,]+)\z~D', $parts[0], $matches) === 1) {
        $count = max(1, min(4, count(explode(',', $matches[1]))));
    }
    return ['batch' => $batch, 'count' => $count];
}

/**
 * REQUEST_URI is the ORIGINAL URI, not PHP_SELF or the rewritten QUERY_STRING.
 * Works with RewriteRule ^api/trpc/([A-Za-z.,]+)$ gateway.php?method=$1 [QSA,L].
 * An internal rewrite's method must match the original path. A client-supplied
 * method query is NOT accepted, nor is direct gateway.php?method=... access.
 */
function pskz_route(string $uri, ?string $rewriteMethod = null): array
{
    $parts = explode('?', $uri, 2);
    if (preg_match('~\A/api/trpc/([A-Za-z.,]+)\z~D', $parts[0], $matches) !== 1) {
        pskz_fail('Некорректный путь API.');
    }
    if (($parts[1] ?? '') !== 'batch=1') {
        pskz_fail('Разрешён только параметр batch=1 без других параметров.');
    }
    if ($rewriteMethod !== null && $rewriteMethod !== $matches[1]) {
        pskz_fail('Параметр маршрута не совпадает с исходным путём.');
    }
    $procedures = explode(',', $matches[1]);
    if (count($procedures) < 1 || count($procedures) > 4) {
        pskz_fail('В одном запросе разрешено от 1 до 4 вызовов.');
    }
    foreach ($procedures as $procedure) {
        if (!in_array($procedure, PSKZ_GATEWAY_PROCEDURES, true)) {
            pskz_fail('Эта процедура API не разрешена.', 'FORBIDDEN');
        }
    }
    return $procedures;
}

function pskz_object_fields($value, array $required, array $optional = []): void
{
    if (!$value instanceof stdClass) {
        pskz_fail('Ожидается JSON-объект.');
    }
    foreach ($required as $key) {
        if (!property_exists($value, $key)) {
            pskz_fail('Отсутствует обязательное поле.');
        }
    }
    foreach (array_keys(get_object_vars($value)) as $key) {
        if (!in_array((string) $key, array_merge($required, $optional), true)) {
            pskz_fail('Запрос содержит неразрешённое поле.');
        }
    }
}

/** JS/Zod string.length counts UTF-16 units; no mbstring dependency on PS.kz. */
function pskz_string_length($value): int
{
    if (!is_string($value)) {
        pskz_fail('Ожидается строка.');
    }
    $utf16 = iconv('UTF-8', 'UTF-16LE', $value);
    if ($utf16 === false) {
        pskz_fail('Некорректная кодировка текста.');
    }
    return intdiv(strlen($utf16), 2);
}

function pskz_bounded_string($value, int $min, int $max): void
{
    $length = pskz_string_length($value);
    if ($length < $min || $length > $max) {
        pskz_fail('Длина текста выходит за допустимые пределы.');
    }
}

function pskz_validate_messages($messages): void
{
    if (!is_array($messages) || count($messages) > 30) {
        pskz_fail('История должна содержать не более 30 сообщений.');
    }
    $total = 0;
    foreach ($messages as $message) {
        pskz_object_fields($message, ['role', 'content']);
        if (!in_array($message->role, ['user', 'assistant'], true)) {
            pskz_fail('Разрешены только роли user и assistant.');
        }
        $length = pskz_string_length($message->content);
        if ($length > 12000) {
            pskz_fail('Сообщение слишком длинное.');
        }
        $total += $length;
    }
    if ($total > 48000) {
        pskz_fail('Общая длина истории превышает 48000 символов.');
    }
}

function pskz_validate_payload(string $procedure, $payload): void
{
    switch ($procedure) {
        case 'ai.chat':
            pskz_object_fields($payload, ['messages']);
            pskz_validate_messages($payload->messages);
            return;
        case 'ai.generateExample':
            pskz_object_fields($payload, ['artifactType']);
            if (!in_array($payload->artifactType, PSKZ_GATEWAY_EXAMPLE_TYPES, true)) {
                pskz_fail('Неизвестный тип примера.');
            }
            return;
        case 'ai.generateArtifacts':
            pskz_object_fields($payload, ['context']);
            pskz_bounded_string($payload->context, 30, 5000);
            return;
        case 'ai.evaluate':
            pskz_object_fields($payload, ['artifact'], ['artifactType', 'messages']);
            pskz_bounded_string($payload->artifact, 10, 30000);
            if (property_exists($payload, 'artifactType')) {
                pskz_bounded_string($payload->artifactType, 0, 100);
            }
            if (property_exists($payload, 'messages')) {
                pskz_validate_messages($payload->messages);
            }
            return;
        default:
            pskz_fail('Эта процедура API не разрешена.', 'FORBIDDEN');
    }
}

/** Reject duplicate keys, including escaped aliases, after JSON syntax validation. */
function pskz_unique_json_keys(string $raw): void
{
    preg_match_all('/"(?:[^"\\\\]|\\\\.)*"|[{}\[\]:,]/s', $raw, $matches);
    $stack = [];
    foreach ($matches[0] as $token) {
        if ($token === '{' || $token === '[') {
            $stack[] = ['object' => $token === '{', 'key' => $token === '{', 'seen' => []];
        } elseif ($token === '}' || $token === ']') {
            array_pop($stack);
        } elseif ($stack !== []) {
            $index = count($stack) - 1;
            if ($token === ',') {
                $stack[$index]['key'] = $stack[$index]['object'];
            } elseif ($token[0] === '"' && $stack[$index]['object'] && $stack[$index]['key']) {
                $key = json_decode($token, true, 8, JSON_THROW_ON_ERROR);
                if (isset($stack[$index]['seen'][$key])) {
                    pskz_fail('Повторяющиеся JSON-ключи не разрешены.');
                }
                $stack[$index]['seen'][$key] = true;
                $stack[$index]['key'] = false;
            }
        }
    }
}

/** Pure request validation. Keep the original SuperJSON bytes on the wire. */
function pskz_validate_request(array $server, string $raw, ?string $rewriteMethod = null): array
{
    if (($server['REQUEST_METHOD'] ?? '') !== 'POST') {
        pskz_fail('Для API разрешён только POST.', 'METHOD_NOT_SUPPORTED');
    }
    if (array_key_exists('HTTP_ORIGIN', $server) && $server['HTTP_ORIGIN'] !== PSKZ_GATEWAY_ORIGIN) {
        pskz_fail('Запрос с этого сайта не разрешён.', 'FORBIDDEN');
    }
    $procedures = pskz_route($server['REQUEST_URI'] ?? '', $rewriteMethod);
    if (preg_match('~\Aapplication/json(?:\s*;\s*charset=utf-8)?\s*\z~iD', $server['CONTENT_TYPE'] ?? '') !== 1) {
        pskz_fail('Требуется Content-Type: application/json.', 'UNSUPPORTED_MEDIA_TYPE');
    }
    if (strlen($raw) > PSKZ_GATEWAY_REQUEST_BYTES) {
        pskz_fail('Размер запроса превышает допустимый предел.', 'PAYLOAD_TOO_LARGE');
    }
    try {
        $inputs = json_decode($raw, false, 32, JSON_THROW_ON_ERROR);
    } catch (JsonException $error) {
        pskz_fail('Не удалось прочитать JSON запроса.', 'PARSE_ERROR');
    }
    pskz_unique_json_keys($raw);
    $indices = array_map('strval', range(0, count($procedures) - 1));
    pskz_object_fields($inputs, $indices);
    foreach ($procedures as $index => $procedure) {
        $envelope = $inputs->{(string) $index};
        // Plain string/array schemas need no SuperJSON meta. Reject transformations
        // rather than let them change the types or bypass limits upstream.
        pskz_object_fields($envelope, ['json']);
        pskz_validate_payload($procedure, $envelope->json);
    }
    return ['procedures' => $procedures, 'count' => count($procedures), 'batch' => true, 'body' => $raw];
}

/** Pure upstream guard; valid responses are passed byte-for-byte, including meta. */
function pskz_validate_upstream(int $status, string $contentType, string $body, bool $batch, int $count): array
{
    if ($status < 200 || $status >= 600 || ($status >= 300 && $status < 400)
        || strlen($body) > PSKZ_GATEWAY_RESPONSE_BYTES
        || preg_match('~\Aapplication/json(?:\s*;[^\r\n]*)?\s*\z~iD', $contentType) !== 1) {
        pskz_unavailable();
    }
    try {
        $decoded = json_decode($body, false, 64, JSON_THROW_ON_ERROR);
    } catch (JsonException $error) {
        pskz_unavailable();
    }
    if ($batch) {
        if (!is_array($decoded) || count($decoded) !== $count || $count < 1 || $count > 4) {
            pskz_unavailable();
        }
        $items = $decoded;
    } else {
        $items = [$decoded];
    }
    $hasSuccess = false;
    foreach ($items as $item) {
        if (!$item instanceof stdClass || property_exists($item, 'error') === property_exists($item, 'result')) {
            pskz_unavailable();
        }
        if (property_exists($item, 'error')) {
            $error = $item->error->json ?? null;
            if (!$error instanceof stdClass || !is_string($error->message ?? null)
                || !is_int($error->code ?? null) || $error->code >= 0
                || !($error->data ?? null) instanceof stdClass
                || !is_string($error->data->code ?? null)
                || !is_int($error->data->httpStatus ?? null)
                || $error->data->httpStatus < 400 || $error->data->httpStatus > 599) {
                pskz_unavailable();
            }
        } else {
            if (!($item->result ?? null) instanceof stdClass
                || !($item->result->data ?? null) instanceof stdClass
                || !property_exists($item->result->data, 'json')) {
                pskz_unavailable();
            }
            $hasSuccess = true;
        }
    }
    if ($hasSuccess && $status !== 200 && $status !== 207) {
        pskz_unavailable();
    }
    // A 200 HTML billing page (even mislabelled JSON) never reaches the browser.
    return ['status' => $status, 'body' => $body];
}

/** Atomic, deterministic sliding-window decision, separate from file IO. */
function pskz_rate_decision(array $timestamps, int $calls, int $now): array
{
    if ($calls < 1 || $calls > 4) {
        pskz_fail('Некорректное число вызовов.');
    }
    $recent = [];
    $minute = 0;
    foreach ($timestamps as $stamp) {
        if (!is_int($stamp) || $stamp > $now) {
            pskz_unavailable();
        }
        if ($stamp > $now - 3600) {
            $recent[] = $stamp;
            if ($stamp > $now - 60) {
                ++$minute;
            }
        }
    }
    $allowed = $minute + $calls <= 12 && count($recent) + $calls <= 120;
    return ['allowed' => $allowed, 'timestamps' => $allowed ? array_merge($recent, array_fill(0, $calls, $now)) : $recent];
}

/** Published Cloudflare proxy ranges: https://www.cloudflare.com/ips-v4 and /ips-v6. Review if Cloudflare changes them. */
const PSKZ_GATEWAY_CLOUDFLARE_RANGES = [
    '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18',
    '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17',
    '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
    '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32',
    '2a06:98c0::/29', '2c0f:f248::/32',
];

function pskz_ip_in_cidr(string $ip, string $cidr): bool
{
    [$network, $bits] = explode('/', $cidr, 2);
    $address = @inet_pton($ip);
    $base = @inet_pton($network);
    if ($address === false || $base === false || strlen($address) !== strlen($base)) {
        return false;
    }
    $bits = (int) $bits;
    $whole = intdiv($bits, 8);
    if ($whole > 0 && substr($address, 0, $whole) !== substr($base, 0, $whole)) {
        return false;
    }
    $rest = $bits % 8;
    if ($rest === 0) {
        return true;
    }
    $mask = (0xFF << (8 - $rest)) & 0xFF;
    return (ord($address[$whole]) & $mask) === (ord($base[$whole]) & $mask);
}

/**
 * The visitor address for rate limiting. CF-Connecting-IP is trusted ONLY when the TCP peer
 * (REMOTE_ADDR) is a published Cloudflare address; otherwise the header is attacker-controlled
 * and ignored. X-Forwarded-For and Forwarded are never used.
 */
function pskz_client_ip(array $server): string
{
    $peer = (string) ($server['REMOTE_ADDR'] ?? '');
    $header = (string) ($server['HTTP_CF_CONNECTING_IP'] ?? '');
    if ($header === '' || filter_var($peer, FILTER_VALIDATE_IP) === false
        || filter_var($header, FILTER_VALIDATE_IP) === false) {
        return $peer;
    }
    foreach (PSKZ_GATEWAY_CLOUDFLARE_RANGES as $range) {
        if (pskz_ip_in_cidr($peer, $range)) {
            return $header;
        }
    }
    return $peer;
}

/** Private state outside the document root, namespaced by this gateway root. */
function pskz_state_directory(string $root): string
{
    $directory = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . '/pskz-jtbd-' . substr(hash('sha256', $root), 0, 24);
    if ((!is_dir($directory) && !@mkdir($directory, 0700, true) && !is_dir($directory))
        || is_link($directory) || !is_writable($directory)) {
        pskz_unavailable();
    }
    return $directory;
}

function pskz_rate_limit(string $directory, string $remoteAddress, int $calls, ?int $now = null): void
{
    // Never use X-Forwarded-For, Forwarded, cookies or authenticated identity. The caller passes
    // pskz_client_ip(), which honours CF-Connecting-IP only from verified Cloudflare peers.
    if (filter_var($remoteAddress, FILTER_VALIDATE_IP) === false) {
        pskz_unavailable();
    }
    $file = $directory . '/ip-' . hash('sha256', $remoteAddress) . '.json';
    $handle = @fopen($file, 'c+');
    if ($handle === false) {
        pskz_unavailable();
    }
    try {
        if (!flock($handle, LOCK_EX)) {
            pskz_unavailable();
        }
        $raw = stream_get_contents($handle, 16385);
        if ($raw === false || strlen($raw) > 16384) {
            pskz_unavailable();
        }
        $timestamps = $raw === '' ? [] : json_decode($raw, true);
        if (!is_array($timestamps) || count($timestamps) > 120) {
            pskz_unavailable();
        }
        $decision = pskz_rate_decision($timestamps, $calls, $now ?? time());
        $encoded = json_encode($decision['timestamps'], JSON_THROW_ON_ERROR);
        if (!ftruncate($handle, 0) || !rewind($handle) || fwrite($handle, $encoded) !== strlen($encoded) || !fflush($handle)) {
            pskz_unavailable();
        }
        if (!$decision['allowed']) {
            pskz_fail('Лимит AI-запросов исчерпан: не более 12 вызовов в минуту и 120 в час. Попробуйте позже.', 'TOO_MANY_REQUESTS');
        }
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

/**
 * Three OS-owned flock slots, NOT expiring leases which can overlap live calls.
 * cURL's 100s timeout releases via finally/shutdown; process death also releases
 * locks automatically. Stale expiry metadata is overwritten when a slot is free.
 * Never unlink these files: replacing locked inodes would break the global cap.
 */
function pskz_acquire_slot(string $directory)
{
    for ($index = 0; $index < 3; ++$index) {
        $handle = @fopen($directory . '/slot-' . $index . '.lock', 'c+');
        if ($handle === false) {
            pskz_unavailable();
        }
        if (flock($handle, LOCK_EX | LOCK_NB)) {
            if (!ftruncate($handle, 0) || fwrite($handle, (string) (time() + 110)) === false || !fflush($handle)) {
                flock($handle, LOCK_UN);
                fclose($handle);
                pskz_unavailable();
            }
            return $handle;
        }
        fclose($handle);
    }
    pskz_fail('AI-сервис сейчас занят. Попробуйте ещё раз немного позже.', 'SERVICE_UNAVAILABLE');
}

function pskz_release_slot($handle): void
{
    if (is_resource($handle)) {
        ftruncate($handle, 0);
        fflush($handle);
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

/** Pure transport policy: callers cannot supply URLs or forwarded headers. */
function pskz_curl_options(array $procedures, string $body): array
{
    // Revalidate even if invoked independently of the HTTP request validator.
    pskz_route('/api/trpc/' . implode(',', $procedures) . '?batch=1');
    return [
        CURLOPT_URL => PSKZ_GATEWAY_UPSTREAM . '/' . implode(',', $procedures) . '?batch=1',
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_MAXREDIRS => 0,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTPS,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 100,
        CURLOPT_PROXY => '',
        CURLOPT_HEADER => false,
        CURLOPT_RETURNTRANSFER => false,
    ];
}

function pskz_forward(array $request): array
{
    if (!extension_loaded('curl')) {
        pskz_unavailable();
    }
    $curl = curl_init();
    if ($curl === false) {
        pskz_unavailable();
    }
    $body = '';
    $headersBytes = 0;
    try {
        $options = pskz_curl_options($request['procedures'], $request['body']);
        $options[CURLOPT_WRITEFUNCTION] = static function ($handle, string $chunk) use (&$body): int {
            if (strlen($body) + strlen($chunk) > PSKZ_GATEWAY_RESPONSE_BYTES) {
                return 0; // Abort transfer without buffering an oversized response.
            }
            $body .= $chunk;
            return strlen($chunk);
        };
        $options[CURLOPT_HEADERFUNCTION] = static function ($handle, string $line) use (&$headersBytes): int {
            $headersBytes += strlen($line);
            return $headersBytes <= 16384 ? strlen($line) : 0;
        };
        if (!curl_setopt_array($curl, $options) || curl_exec($curl) === false) {
            pskz_unavailable();
        }
        return pskz_validate_upstream(
            (int) curl_getinfo($curl, CURLINFO_HTTP_CODE),
            (string) curl_getinfo($curl, CURLINFO_CONTENT_TYPE),
            $body,
            $request['batch'],
            $request['count']
        );
    } finally {
        curl_close($curl);
    }
}
