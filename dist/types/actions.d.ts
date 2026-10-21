/**
 * Copyright (C) 2025 Alibaba Group Holding Limited
 * All rights reserved.
 */
import type { InteractiveElementDomNode } from './dom/dom_tree/type';
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
export declare function clickElement(element: HTMLElement): Promise<void>;
/**
 * @private Internal method, subject to change at any time.
 */
export declare function inputTextElement(element: HTMLElement, text: string): Promise<void>;
/**
 * @todo browser-use version is very complex and supports menu tags, need to follow up
 * @private Internal method, subject to change at any time.
 */
export declare function selectOptionElement(selectElement: HTMLSelectElement, optionText: string): Promise<void>;
/**
 * @private Internal method, subject to change at any time.
 */
export declare function scrollIntoViewIfNeeded(element: Element): Promise<void>;
export declare function scrollVertically(scroll_amount: number, element?: HTMLElement | null): Promise<string>;
export declare function scrollHorizontally(scroll_amount: number, element?: HTMLElement | null): Promise<string>;
