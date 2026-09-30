#!/bin/sh
set -eu
# Docker's default bridge uses the host DNS rather than embedded DNS.
calendar_resolver=$(awk '$1 == "nameserver" {print $2; exit}' /etc/resolv.conf)
if [ -z "$calendar_resolver" ]; then
  echo 'No DNS nameserver is configured in /etc/resolv.conf' >&2
  exit 1
fi
case "$calendar_resolver" in
  *:*) calendar_resolver="[$calendar_resolver]" ;;
esac
sed "s/resolver 127.0.0.11 /resolver $calendar_resolver /" /etc/nginx/calendar-source.conf > /etc/nginx/conf.d/default.conf
