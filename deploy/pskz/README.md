# Synthetic JTBD — размещение на PS.kz

Сайт полностью статический: страницы, книга и Research Navigator работают в браузере, серверной части, PHP и ИИ-функций нет. Прогресс чтения хранится в localStorage браузера.

## Состав релиза

`scripts/build-pskz.mjs` собирает каталог с `index.html`, `assets/`, `media/job_chain_diagram_a891f841.png`, `.htaccess`, `robots.txt` и `release.json` (хеш коммита, время сборки). Исходники книги, `.env`, ключи, `node_modules` и source maps в релиз не входят. `.htaccess` отдаёт SPA-маршруты через `index.html`, на неизвестные `/api/*` отвечает 404 и закрывает скрытые и служебные файлы.

Локально: `node scripts/build-pskz.mjs <каталог-релиза> <путь-к-png>`.

Шрифты (Literata и Golos Text) подключены через `@fontsource-variable` и отдаются с того же домена, внешних запросов к Google Fonts нет.

## Автоматическая выкладка из GitHub

Workflow `.github/workflows/deploy-pskz.yml` собирает релиз и загружает его на PS.kz при каждом пуше в `main`, который затрагивает `client/`, `shared/`, `server/book_content.md`, `deploy/pskz/`, `scripts/`, `package.json` или `pnpm-lock.yaml`. Запустить вручную можно во вкладке Actions («Run workflow»); флаг `dry_run` показывает, что будет загружено, без изменений на хостинге.

Порядок: тесты и `pnpm check` → сборка `scripts/build-pskz.mjs` → загрузка по FTP(S)/SFTP (сначала все файлы, кроме `index.html` и `.htaccess`, затем они и удаление устаревших файлов) → проверка, что `https://jtbd.mikh.kz/release.json` содержит хеш собранного коммита.

Настройка в GitHub (Settings → Secrets and variables → Actions):

| Имя | Тип | Значение |
| --- | --- | --- |
| `PSKZ_FTP_HOST` | secret | хост FTP/SFTP из Plesk |
| `PSKZ_FTP_USER` | secret | отдельный FTP-пользователь с доступом только к каталогу сайта JTBD |
| `PSKZ_FTP_PASSWORD` | secret | пароль этого пользователя |
| `PSKZ_FTP_DIR` | secret | `/`, если FTP-пользователь создан с домашней папкой сайта JTBD (рекомендуется); иначе путь к document root JTBD |
| `PSKZ_PROTOCOL` | variable, необязательно | `ftp` (FTPS, по умолчанию) или `sftp` |
| `PSKZ_VERIFY_TLS` | variable, необязательно | `no`, только если сертификат FTPS на хосте самоподписанный |

Без секретов `PSKZ_FTP_*` workflow только тестирует и собирает релиз, на хостинг ничего не отправляет. Выкладка использует `mirror --delete` внутри `PSKZ_FTP_DIR`, поэтому каталог должен быть выделен под этот сайт (в Plesk: дополнительная учётная запись FTP с домашней папкой `/jtbd-release-20261121`, тогда `PSKZ_FTP_DIR=/`); каталоги `.well-known`, `cgi-bin`, `error_docs`, `stat` не затрагиваются. Пароли не хранить в репозитории и не отправлять в чат.

Иллюстрация книги: положите `job_chain_diagram_a891f841.png` в `deploy/pskz/media/` и закоммитьте. Если файла нет, workflow скачивает его с действующего сайта, что удобно для первого запуска, но хрупко.

Откат: перезапустить workflow на предыдущем коммите (Actions → Run workflow, выбрав ветку/тег с нужной версией) либо `git revert` и пуш в `main`.
