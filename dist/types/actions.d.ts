/**
 * Copyright (C) 2025 Alibaba Group Holding Limited
 * All rights reserved.
 */
import type { InteractiveElementDomNode } from './dom/dom_tree/type';
/** Validation at the final synchronous boundary before generated input or a value write. */
export interface ActionOptions {
    /**
     * Must be synchronous. Throw to stop the action; no events or writes after this
     * checkpoint are performed. A phase may be checked multiple times because host
     * event handlers can synchronously change the target between dispatches.
     */
    beforeDispatch?: (phase: 'pointer' | 'click' | 'write') => void;
}
/**
 * Get the HTMLElement by index from a selectorMap.
 * @private Internal method, subject to change at any time.
 */
export declare function getElementByIndex(selectorMap: Map<number, InteractiveElementDomNode>, index: number): HTMLElement;
/**
 * Simulate a full click following W3C Pointer Events + UI Events spec order:
 * pointerover/enter → mouseover/enter → pointerdown → mousedown → [focus] →
 * pointerup → mouseup → click
 *
 * @private Internal method, subject to change at any time.
 */
export declare function clickElement(element: HTMLElement, options?: ActionOptions): Promise<void>;
/**
 * @private Internal method, subject to change at any time.
 */
export declare function inputTextElement(element: HTMLElement, text: string, options?: ActionOptions): Promise<void>;
/**
 * @todo browser-use version is very complex and supports menu tags, need to follow up
 * @private Internal method, subject to change at any time.
 */
export declare function selectOptionElement(selectElement: HTMLSelectElement, optionText: string, actionOptions?: ActionOptions): Promise<void>;
/**
 * @private Internal method, subject to change at any time.
 */
export declare function scrollIntoViewIfNeeded(element: Element): Promise<void>;
export declare function scrollVertically(scroll_amount: number, element?: HTMLElement | null): Promise<string>;
export declare function scrollHorizontally(scroll_amount: number, element?: HTMLElement | null): Promise<string>;
