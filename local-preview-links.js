/* Alomari Tech | Dual-mode internal navigation
   - GitHub Pages / HTTP: keep clean production URLs (/privacy/).
   - Direct file:// Chrome preview: point links to the real local index.html files.
   No network requests, frameworks or routing setup needed. */
(() => {
  'use strict';
  if (window.location.protocol !== 'file:') return;

  const thisScript = document.currentScript;
  if (!thisScript || !thisScript.src) return;
  // This script always resides at the website root, even when included from subpages.
  const siteRoot = new URL('./', thisScript.src);
  const fileRoutes = Object.freeze({
    '/': 'index.html',
    '/index.html': 'index.html',
    '/404.html': '404.html',
    '/legal/': 'legal/index.html',
    '/legal': 'legal/index.html',
    '/privacy/': 'privacy/index.html',
    '/privacy': 'privacy/index.html',
    '/privacy.html': 'privacy/index.html',
    '/terms/': 'terms/index.html',
    '/terms': 'terms/index.html',
    '/terms.html': 'terms/index.html',
    '/cookies/': 'cookies/index.html',
    '/cookies': 'cookies/index.html',
    '/cookies.html': 'cookies/index.html'
  });

  function fixLink(anchor) {
    const original = anchor.getAttribute('href');
    if (!original || !original.startsWith('/') || original.startsWith('//')) return;
    const parts = /^([^?#]*)(\?[^#]*)?(#.*)?$/.exec(original);
    if (!parts) return;
    const destination = fileRoutes[parts[1]];
    if (!destination) return;
    const url = new URL(destination, siteRoot);
    url.search = (parts[2] || '').replace(/^\?/, '');
    url.hash = (parts[3] || '').replace(/^#/, '');
    anchor.setAttribute('href', url.href);
  }

  function fixAllLinks() {
    document.querySelectorAll('a[href^="/"]').forEach(fixLink);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixAllLinks, {once:true});
  } else {
    fixAllLinks();
  }

  // Also covers anchors dynamically inserted after the initial HTML parses.
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes' && record.target instanceof HTMLAnchorElement) {
        fixLink(record.target);
      }
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node instanceof HTMLAnchorElement) fixLink(node);
        node.querySelectorAll('a[href^="/"]').forEach(fixLink);
      }
    }
  });
  observer.observe(document.documentElement, {
    subtree:true, childList:true, attributes:true, attributeFilter:['href']
  });
})();
