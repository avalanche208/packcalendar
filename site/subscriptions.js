export function appleSubscriptionURL(feed) {
  const url = new URL(feed);
  if (!['http:', 'https:'].includes(url.protocol)) throw new TypeError('Expected an HTTP calendar feed URL');
  // URL.protocol cannot change a special HTTP URL to a non-special webcal URL.
  return 'webcal://' + url.host + url.pathname + url.search;
}
