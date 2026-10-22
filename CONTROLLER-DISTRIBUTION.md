# MIE browser controller distribution

This branch packages the browser-only controller from `alibaba/page-agent` for Git npm dependencies. It has no LLM, API key, backend, or registry publication requirement. The bundled files are committed so installing a pinned commit does not execute a build or install the monorepo.

Upstream source: https://github.com/alibaba/page-agent/commit/9eb6b6646500264d9034dd466a4270cb9fc1ef1e
Fork: https://github.com/mieweb/page-agent/tree/mie-controller-dist
Upstream version: 1.12.4. License: MIT; see LICENSE and THIRD_PARTY_NOTICES.md.

```js
import { PageController } from '@mieweb/page-controller';

const controller = new PageController({
  rootElement: document.querySelector('#app-scope'),
  enableMask: false,
  highlightOpacity: 0,
  highlightLabelOpacity: 0,
});
const content = await controller.updateTree();
const element = await controller.resolveElement(0);
```

`rootElement?: HTMLElement` scopes extraction to that same-document subtree and rejects detached roots. `resolveElement(index): Promise<HTMLElement>` resolves the current index without refreshing it, and rejects detached or out-of-root elements. Index-based controller actions use this resolver too. Indexes still reset on every `updateTree()`: callers must maintain snapshot tokens, reject stale tokens, validate current element semantics and action policy, and serialize snapshots/actions. The resolver does not establish authorization or promise that a connected element is unchanged.

`clickElement(index, options)`, `inputText(index, text, options)`, and `selectOption(index, text, options)` accept `ActionOptions` with an optional synchronous `beforeDispatch(phase)` callback. The phases are `pointer` before generated pointer/mouse events or focus, `click` immediately before click activation, and `write` immediately before a text/select value mutation. Checkpoints run after asynchronous movement delays and again after synchronous host handlers where needed. Throw to stop the action with `success: false`; already dispatched events or completed writes are not rolled back. A phase can run multiple times, so callbacks must validate the current state synchronously rather than start asynchronous work. For example:

```js
await controller.inputText(index, 'Updated notes', {
  beforeDispatch() {
    if (currentRecordId() !== expectedRecordId) throw new Error('Record changed');
  },
});
```

`data-page-agent-ignore="true"` excludes a subtree. Interactive blacklist/whitelist settings are interaction heuristics, not redaction. Default extracted value attributes are not redacted. Configure the application adapter before disclosing a snapshot.

The root is a container boundary, not itself an actionable indexed control. Scoped action resolution intentionally rejects elements inside nested frame documents. Global scroll remains a browser-page action and can scroll ancestors; an adapter requiring strict container confinement must use its own scoped scroll operation. The optional visual mask covers the host document. For mask visuals, import `@mieweb/page-controller/style.css` explicitly. With `enableMask: false`, CSS is optional.

The controller still includes upstream `executeJavascript`; an MCP adapter should not expose it. Removing a navigate tool cannot prevent arbitrary host event handlers from navigating: action allowlists and host routing policy remain the adapter's responsibility. Clicks and fills use synthetic input and do not carry native browser automation privileges.

To regenerate using Node >=20:

```sh
npm ci --ignore-scripts
npm run regenerate
npm run test:controller
```

The original monorepo manifests are preserved as `monorepo.package.json` and `monorepo.package-lock.json`. The distribution root intentionally has no workspaces or install/prepare/prepack/build hook; `regenerate` is an explicit maintenance command. Pin consumers to a full commit SHA, rather than this mutable branch name.
