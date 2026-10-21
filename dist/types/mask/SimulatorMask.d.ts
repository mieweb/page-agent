import { Motion } from 'ai-motion';
export declare class SimulatorMask extends EventTarget {
    #private;
    shown: boolean;
    wrapper: HTMLDivElement;
    motion: Motion | null;
    constructor();
    setCursorPosition(x: number, y: number): void;
    triggerClickAnimation(): void;
    show(): void;
    hide(): void;
    dispose(): void;
}
