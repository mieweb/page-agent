export declare function isHTMLElement(el: unknown): el is HTMLElement;
export declare function isInputElement(el: Element): el is HTMLInputElement;
export declare function isTextAreaElement(el: Element): el is HTMLTextAreaElement;
export declare function isSelectElement(el: Element): el is HTMLSelectElement;
export declare function isAnchorElement(el: Element): el is HTMLAnchorElement;
/** Iframe offset for translating element coordinates to top-frame viewport. */
export declare function getIframeOffset(element: HTMLElement): {
    x: number;
    y: number;
};
/**
 * Get native value setter from the element's own prototype (iframe-safe).
 * @note for React
 */
export declare function getNativeValueSetter(element: HTMLInputElement | HTMLTextAreaElement): (v: string) => void;
export declare function waitFor(seconds: number): Promise<void>;
/**
 * Move the visual pointer to a position within an element.
 * @param x - x coordinate in the element's document viewport
 * @param y - y coordinate in the element's document viewport
 */
export declare function movePointerToElement(element: HTMLElement, x: number, y: number): Promise<void>;
export declare function clickPointer(): Promise<void>;
export declare function enablePassThrough(): Promise<void>;
export declare function disablePassThrough(): Promise<void>;
