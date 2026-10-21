import * as dom from './dom';
/**
 * Configuration for PageController
 */
export interface PageControllerConfig extends dom.DomConfig {
    /** Enable visual mask overlay during operations (default: false) */
    enableMask?: boolean;
}
/**
 * Structured browser state for LLM consumption
 */
export interface BrowserState {
    url: string;
    title: string;
    /** Page info + scroll position hint (e.g. "Page info: 1920x1080px...\n[Start of page]") */
    header: string;
    /** Simplified HTML of interactive elements */
    content: string;
    /** Page footer hint (e.g. "... 300 pixels below ..." or "[End of page]") */
    footer: string;
}
interface ActionResult {
    success: boolean;
    message: string;
}
/**
 * PageController manages DOM state and element interactions.
 * It provides async methods for all DOM operations, keeping state isolated.
 *
 * @lifecycle
 * - beforeUpdate: Emitted before the DOM tree is updated.
 * - afterUpdate: Emitted after the DOM tree is updated.
 */
export declare class PageController extends EventTarget {
    private config;
    /** Corresponds to eval_page in browser-use */
    private flatTree;
    /**
     * All highlighted index-mapped interactive elements
     * Corresponds to DOMState.selector_map in browser-use
     */
    private selectorMap;
    /** Index -> element text description mapping */
    private elementTextMap;
    /**
     * Simplified HTML for LLM consumption.
     * Corresponds to clickable_elements_to_string in browser-use
     */
    private simplifiedHTML;
    /** last time the tree was updated */
    private lastTimeUpdate;
    /** Whether the tree has been indexed at least once */
    private isIndexed;
    /** Visual mask overlay for blocking user interaction during automation */
    private mask;
    private maskReady;
    constructor(config?: PageControllerConfig);
    /**
     * Initialize mask asynchronously (dynamic import to avoid CSS loading in Node)
     */
    initMask(): void;
    /**
     * Get current page URL
     */
    getCurrentUrl(): Promise<string>;
    /**
     * Get last tree update timestamp
     */
    getLastUpdateTime(): Promise<number>;
    /**
     * Get structured browser state for LLM consumption.
     * Automatically calls updateTree() to refresh the DOM state.
     */
    getBrowserState(): Promise<BrowserState>;
    /**
     * Update DOM tree, returns simplified HTML for LLM.
     * This is the main method to refresh the page state.
     * Automatically bypasses mask during DOM extraction if enabled.
     */
    updateTree(): Promise<string>;
    /**
     * Clean up all element highlights
     */
    cleanUpHighlights(): Promise<void>;
    /**
     * Ensure the tree has been indexed before any index-based operation.
     * Throws if updateTree() hasn't been called yet.
     */
    private assertIndexed;
    /**
     * Resolve a reference from the latest updateTree() without rebuilding or renumbering it.
     * Callers must associate indices with their own snapshot token and serialize operations.
     * Scoped controllers only act on elements in their same-document root subtree.
     */
    resolveElement(index: number): Promise<HTMLElement>;
    /**
     * Click element by index
     */
    clickElement(index: number): Promise<ActionResult>;
    /**
     * Input text into element by index
     */
    inputText(index: number, text: string): Promise<ActionResult>;
    /**
     * Select dropdown option by index and option text
     */
    selectOption(index: number, optionText: string): Promise<ActionResult>;
    /**
     * Scroll vertically
     */
    scroll(options: {
        down: boolean;
        numPages: number;
        pixels?: number;
        index?: number;
    }): Promise<ActionResult>;
    /**
     * Scroll horizontally
     */
    scrollHorizontally(options: {
        right: boolean;
        pixels: number;
        index?: number;
    }): Promise<ActionResult>;
    /**
     * Execute arbitrary JavaScript on the page.
     * The optional `signal` is exposed to the script scope so cooperative code
     * can abort promptly when the task is stopped.
     */
    executeJavascript(script: string, signal?: AbortSignal): Promise<ActionResult>;
    /**
     * Show the visual mask overlay.
     * Only works after mask is setup.
     */
    showMask(): Promise<void>;
    /**
     * Hide the visual mask overlay.
     * Only works after mask is setup.
     */
    hideMask(): Promise<void>;
    /**
     * Dispose and clean up resources
     */
    dispose(): void;
}
export * from './actions';
