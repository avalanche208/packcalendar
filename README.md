# Pack 77 Public Calendar

Version 2026.9.30-1e. Custom responsive month/schedule calendar plus a rehosted, live iCalendar subscription feed. No Google embed, Google account, API key, database, or application server. A single nginx container serves the site and proxies the public Google Calendar feed.

Source: s3ijfped1qod4lkan99kmsneic@group.calendar.google.com

## Recommended unRAID installation

Use the published image `avalanche208/packcalendar:latest`.

1. In Docker → Add Container, enter Name `packcalendar`, Repository `avalanche208/packcalendar:latest`, and Network `Bridge`.
2. Map container port `80` (TCP) to host port `8080`, or another unused port.
3. Set WebUI to `http://[IP]:[PORT:80]/`. No appdata paths, environment variables, or volume mappings are required.
4. Apply and enable autostart. Open `http://UNRAID-IP:8080`.
5. Point your HTTPS reverse proxy at this port. Subscribers use `https://YOUR-DOMAIN/calendar.ics`.

A ready-made template is included at `unraid/packcalendar.xml`. To load it manually, copy it to `/boot/config/plugins/dockerMan/templates-user/my-packcalendar.xml`, then select the template under Docker → Add Container.

GitHub: https://github.com/avalanche208/packcalendar
Docker Hub: https://hub.docker.com/r/avalanche208/packcalendar

## Automated builds

Every push to main runs recurrence tests, builds the container, checks nginx, and verifies the live proxy feed and cache. Only passing builds publish `latest` and the tag in `VERSION` for amd64 and arm64. The workflow can also be run manually from Actions.

Repository Actions secrets must be `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`, or the alternative names `DOCKER_USERNAME` and `DOCKER_PASSWORD`. Use a Docker Hub token with write permission. Secrets from other repositories are not automatically shared. Never commit credentials.

## Alternative: install using the official nginx image

1. Extract this archive. Copy `site/` to `/mnt/user/appdata/pack77-calendar/site/`. Copy `nginx.conf` to `/mnt/user/appdata/pack77-calendar/nginx.conf`.
2. In Docker → Add Container, set:
   - Name: `pack77-calendar`
   - Repository: `nginx:stable-alpine`
   - Network: a custom Docker bridge network (the alternative official image configuration uses Docker DNS at 127.0.0.11)
   - Port: host `8080` → container `80`, TCP. Choose another host port if occupied.
   - Path: `/mnt/user/appdata/pack77-calendar/site` → `/usr/share/nginx/html`, Read Only.
   - Path: `/mnt/user/appdata/pack77-calendar/nginx.conf` → `/etc/nginx/conf.d/default.conf`, Read Only. This configuration is REQUIRED for the live feed.
   - WebUI: `http://[IP]:[PORT:80]/`
3. Apply and enable autostart. Open `http://UNRAID-IP:8080` to test.
4. Point your public reverse proxy or tunnel to `http://UNRAID-IP:8080`. Use HTTPS on the public domain; TLS can terminate at your proxy. Container port 80 uses plain HTTP.
5. Test `https://YOUR-DOMAIN/calendar.ics` from outside your network. It must return an iCalendar document beginning with BEGIN:VCALENDAR, not a login page.
6. Share `https://YOUR-DOMAIN/`. Open the website through the public domain before copying subscription links; links automatically use the address at which the page was opened.

The official nginx method does not require a custom Docker Hub image. Do not expose the unRAID administration interface.

## Build the self-contained image instead

From this folder on a machine with Docker:

```sh
docker build -t pack77-calendar:2026.9.30-1e .
docker run -d --name pack77-calendar --restart unless-stopped -p 8080:80 pack77-calendar:2026.9.30-1e
```

The included Compose file pulls the published image: `docker compose up -d`. The image includes the site and nginx configuration. No bind mounts are required. Both installation methods require outbound HTTPS and DNS to Google. The published image automatically uses the container’s configured DNS server, supporting both default and custom bridge networks.

## Subscriptions without a Google account

The public feed is hosted at `https://YOUR-DOMAIN/calendar.ics`. Clients receive the full original feed, preserving event identifiers, time zones, recurring rules, exceptions, cancellations and updates. Subscription is read-only.

- iOS/iPadOS/macOS: tap the Apple Calendar subscription button, which uses `webcal://YOUR-DOMAIN/calendar.ics`, and confirm Subscribe. Alternatively, add the HTTPS feed address through the calendar app's subscription option.
- Android: an app with iCalendar URL subscription support can use the HTTPS address directly. If the preferred app lacks this support, use ICSx⁵ (https://icsx5.bitfire.at/) to subscribe and sync into Android calendar storage. Display that calendar in Samsung Calendar or another app that supports device calendars. No Google account is required. ICSx⁵ is a separate app and may cost money. App permissions, battery restrictions and refresh settings can affect synchronization.
- Other apps: use Subscribe from web / Add calendar by URL. Downloading and importing the file is a one-time copy and will not receive later changes.

Rehosting does not give every Android calendar app a built-in subscription feature. ICSx⁵ is the documented alternative for devices without it. No universally supported Android one-tap native subscription mechanism is assumed.

## Refresh and availability

- Google remains the dynamic source. Edit events in Google Calendar; no rebuild is needed.
- nginx fetches the public feed on demand and caches successful responses for 5 minutes. It serves cached data during transient upstream errors. Cache is ephemeral and is lost on container recreation; until the first successful fetch, an upstream outage means no feed is available.
- Browsers refresh every 5 minutes while visible, on returning to the tab, or with Refresh. Subscribed calendar apps choose their own refresh interval; updates are not instant.
- The calendar must remain public with event details visible. The full public feed is available to anyone at your URL. Calendar sharing changes apply after cache/client refreshes.
- The website renders the feed locally using bundled ICAL.js 2.2.1, including recurrence, exclusions, modified occurrences, and feed-defined time zones. No CDN is needed at runtime. Timed events display in the browser's local time zone; all-day dates remain dates.
- Phones default to Schedule; larger screens default to Month. Users may select either and view event details.
- If the feed fails before loading, the site shows a retry message. If refresh fails, previously loaded events remain visible. The website labels stale nginx responses.

## Customize

Change name/text in `site/index.html`, styling in `site/style.css`. Change the source calendar in nginx.conf. Subscription buttons continue to point at your rehosted feed. Host at the domain root; serving under a subdirectory requires corresponding proxy and feed-path changes.

ICAL.js is distributed unmodified under Mozilla Public License 2.0; see `site/ICAL-LICENSE.txt`. Source: https://github.com/kewisch/ical.js/tree/v2.2.1 .

## Verification performed

- Google's public feed returned HTTP 200, calendar name Cub Scout Pack 77, time zone America/Chicago, and 258 event components.
- Live feed parsing and recurrence expansion succeeded.
- Focused checks passed for recurring exclusions, moved occurrences, and cancelled occurrences.
- JavaScript syntax and package contents checked.

Docker/nginx execution and browser/device visual QA could not be completed in this workspace. Verify the container and mobile/desktop display after installation. This package is ready to install, but is not yet publicly deployed.
