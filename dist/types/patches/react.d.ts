import type { PageController } from '../PageController';
export declare function patchReact(pageController: PageController): void;
/**
 * @todo (Heavy, might have false negatives) Interaction detection, if element width/height equals body offsetWidth/Height, consider it root element and non-interactive (React often attaches many events to root elements, causing false positives)
 */
