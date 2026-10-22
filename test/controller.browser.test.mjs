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

test('action checkpoints reject context changes during movement and synchronous host handlers', async () => {
  const server = createServer(async (req, res) => {
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end('<!doctype html><html><body><main id="scope"><button id="action">Action target</button><textarea id="notes">Record A</textarea><select id="owner"><option>A</option><option>B</option></select><div id="editor" contenteditable="true">Record A</div></main></body></html>');
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
      const controller = new PageController({rootElement: document.querySelector('#scope'), enableMask: false, highlightOpacity: 0, highlightLabelOpacity: 0});
      const snapshot = await controller.updateTree();
      const indices = new Map();
      for (const match of snapshot.matchAll(/\[(\d+)\]/g)) {
        const index = Number(match[1]);
        indices.set((await controller.resolveElement(index)).id, index);
      }
      for (const id of ['action', 'notes', 'owner', 'editor']) {
        if (!indices.has(id)) throw new Error(`Missing ${id}: ${snapshot}`);
      }
      const action = document.querySelector('#action');
      const notes = document.querySelector('#notes');
      const owner = document.querySelector('#owner');
      const editor = document.querySelector('#editor');
      let record = 'A';
      const phases = [];
      const options = {beforeDispatch(phase) {
        phases.push(phase);
        if (record !== 'A') throw new Error('Record changed');
      }};
      let clicks = 0;
      let pointerDowns = 0;
      action.addEventListener('click', () => { clicks++; });
      action.addEventListener('pointerdown', () => { pointerDowns++; });

      // Movement yields for animation. A record switch in that window must stop
      // even the first generated pointer event and focus, not merely the click.
      window.addEventListener('PageAgent::MovePointerTo', () => {
        queueMicrotask(() => { record = 'B'; });
      }, {once: true});
      const duringMovement = await controller.clickElement(indices.get('action'), options);
      const movementState = {clicks, pointerDowns, focused: document.activeElement === action};

      // Host hover handlers can synchronously switch records between dispatches.
      record = 'A';
      action.addEventListener('pointerover', () => { record = 'B'; }, {once: true});
      const duringHover = await controller.clickElement(indices.get('action'), options);
      const hoverState = {clicks, pointerDowns, focused: document.activeElement === action};

      // A mouseup handler runs immediately before the actual activation.
      record = 'A';
      action.addEventListener('mouseup', () => { record = 'B'; }, {once: true});
      const beforeClick = await controller.clickElement(indices.get('action'), options);
      const clicksAfterMouseup = clicks;

      // inputText awaits its click and post-click delay. The same textarea can
      // be reused for a newly selected record by the click handler.
      record = 'A';
      notes.addEventListener('click', () => {
        record = 'B';
        notes.value = 'Record B';
      }, {once: true});
      const beforeWrite = await controller.inputText(indices.get('notes'), 'Wrong record', options);
      const notesAfterRejectedWrite = notes.value;

      // selectOption also yields while resolving its index.
      record = 'A';
      const selecting = controller.selectOption(indices.get('owner'), 'B', options);
      record = 'B';
      const beforeSelect = await selecting;
      const ownerAfterRejectedWrite = owner.value;

      // beforeinput listeners run synchronously before contenteditable writes.
      record = 'A';
      editor.addEventListener('beforeinput', () => {
        record = 'B';
        editor.innerText = 'Record B';
      }, {once: true});
      const beforeEditableWrite = await controller.inputText(indices.get('editor'), 'Wrong record', options);
      const editorAfterRejectedWrite = editor.innerText;

      record = 'A';
      const validWrite = await controller.inputText(indices.get('notes'), 'Approved', options);
      const validValue = notes.value;
      controller.dispose();
      return {duringMovement, movementState, duringHover, hoverState, beforeClick, clicksAfterMouseup, beforeWrite, notesAfterRejectedWrite, beforeSelect, ownerAfterRejectedWrite, beforeEditableWrite, editorAfterRejectedWrite, validWrite, validValue, phases};
    });
    for (const action of ['duringMovement', 'duringHover', 'beforeClick', 'beforeWrite', 'beforeSelect', 'beforeEditableWrite']) {
      assert.equal(result[action].success, false, action);
      assert.match(result[action].message, /Record changed/, action);
    }
    assert.deepEqual(result.movementState, {clicks: 0, pointerDowns: 0, focused: false});
    assert.deepEqual(result.hoverState, {clicks: 0, pointerDowns: 0, focused: false});
    assert.equal(result.clicksAfterMouseup, 0);
    assert.equal(result.notesAfterRejectedWrite, 'Record B');
    assert.equal(result.ownerAfterRejectedWrite, 'A');
    assert.equal(result.editorAfterRejectedWrite, 'Record B');
    assert.equal(result.validWrite.success, true);
    assert.equal(result.validValue, 'Approved');
    assert.deepEqual([...new Set(result.phases)].sort(), ['click', 'pointer', 'write']);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
