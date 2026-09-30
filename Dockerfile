FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/calendar-source.conf
COPY docker-entrypoint.d/19-calendar-dns.sh /docker-entrypoint.d/19-calendar-dns.sh
RUN chmod +x /docker-entrypoint.d/19-calendar-dns.sh && /docker-entrypoint.d/19-calendar-dns.sh
COPY site/ /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
