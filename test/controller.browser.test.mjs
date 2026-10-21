import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { chromium } from 'playwright-core';

test('built ESM scopes snapshots and guards connected element references', async () => {
  const server = createServer(async (req, res) => {
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end('<!doctype html><html><body><p>OUTSIDE_SECRET</p><main id="scope"><p>SCOPED_TEXT</p><button id="inside">Inside action</button><input id="field" value="initial"><section data-page-agent-ignore="true">IGNORED_SECRET<button>Ignored action</button></section></main><button id="outside">Outside action</button></body></html>');
      return;
    }
    if (req.url === '/dist/page-controller.js') {
      res.setHeader('Content-Type', 'text/javascript');
      res.end(await readFile(resolve('dist/page-controller.js')));
      return;
    }
    res.statusCode = 404;
    res.end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    const result = await page.evaluate(async () => {
      const { PageController } = await import('/dist/page-controller.js');
      const scope = document.querySelector('#scope');
      const controller = new PageController({rootElement: scope, enableMask: false, highlightOpacity: 0, highlightLabelOpacity: 0});
      const snapshot = await controller.updateTree();
      const match = snapshot.match(/\[(\d+)\]<button[^>]*>Inside action/);
      if (!match) throw new Error(`Missing inside button: ${snapshot}`);
      const index = Number(match[1]);
      const inside = document.querySelector('#inside');
      const resolved = await controller.resolveElement(index);
      let clicks = 0;
      inside.addEventListener('click', () => { clicks++; });
      const clicked = await controller.clickElement(index);
      document.body.appendChild(inside);
      let movedError;
      try { await controller.resolveElement(index); } catch (error) { movedError = error.message; }
      const movedClick = await controller.clickElement(index);
      inside.remove();
      let detachedError;
      try { await controller.resolveElement(index); } catch (error) { detachedError = error.message; }
      scope.remove();
      let detachedRootError;
      try { await controller.updateTree(); } catch (error) { detachedRootError = error.message; }
      controller.dispose();
      return {snapshot, sameElement: resolved === inside, clicked, clicks, movedError, movedClick, detachedError, detachedRootError};
    });
    assert.match(result.snapshot, /SCOPED_TEXT/);
    assert.doesNotMatch(result.snapshot, /OUTSIDE_SECRET|Outside action|IGNORED_SECRET|Ignored action/);
    assert.equal(result.sameElement, true);
    assert.equal(result.clicked.success, true);
    assert.equal(result.clicks, 1);
    assert.match(result.movedError, /outside the configured root/);
    assert.equal(result.movedClick.success, false);
    assert.match(result.detachedError, /detached/);
    assert.match(result.detachedRootError, /rootElement is detached/);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
