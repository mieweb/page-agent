import { FlatDomTree, InteractiveElementDomNode } from './dom_tree/type';
export declare function resolveViewportExpansion(viewportExpansion?: number): number;
export interface DomConfig {
    /** Root subtree for extraction. Defaults to document.body. Same document only. */
    rootElement?: HTMLElement;
    viewportExpansion?: number;
    interactiveBlacklist?: (Element | (() => Element))[];
    interactiveWhitelist?: (Element | (() => Element))[];
    includeAttributes?: string[];
    highlightOpacity?: number;
    highlightLabelOpacity?: number;
    /**
     * Preserve semantic landmark tags in dehydrated output even if not interactive
     * @note maybe confusing for LLM combining with page scrolling, use with caution
     **/
    keepSemanticTags?: boolean;
}
export declare function getFlatTree(config: DomConfig): FlatDomTree;
/**
 * elementsToString 内部使用的类型
 */
interface TreeNode {
    type: 'text' | 'element';
    parent: TreeNode | null;
    children: TreeNode[];
    isVisible: boolean;
    text?: string;
    tagName?: string;
    attributes?: Record<string, string>;
    isInteractive?: boolean;
    isTopElement?: boolean;
    isNew?: boolean;
    highlightIndex?: number;
    extra?: Record<string, any>;
}
/**
 * 对应 python 中的 views::clickable_elements_to_string,
 * 将 dom 信息处理成适合 llm 阅读的文本格式
 * @形如
 * ``` text
 * [0]<a aria-label=page-agent.js 首页 />
 * [1]<div >P />
 * [2]<div >page-agent.js
 * UI Agent in your webpage />
 * [3]<a >文档 />
 * [4]<a aria-label=查看源码（在新窗口打开）>源码 />
 * UI Agent in your webpage
 * 用户输入需求，AI 理解页面并自动操作。
 * [5]<a role=button>快速开始 />
 * [6]<a role=button>查看文档 />
 * 无需后端
 * ```
 * 其中可交互元素用序号标出，提示llm可以用序号操作。
 * 缩进代表父子关系。
 * 普通文本则直接列出来。
 *
 * @todo 数据脱敏过滤器
 */
export declare function flatTreeToString(flatTree: FlatDomTree, includeAttributes?: string[], keepSemanticTags?: boolean): string;
export declare const getAllTextTillNextClickableElement: (node: TreeNode, maxDepth?: number) => string;
export declare function getSelectorMap(flatTree: FlatDomTree): Map<number, InteractiveElementDomNode>;
export declare function getElementTextMap(simplifiedHTML: string): Map<number, string>;
export declare function cleanUpHighlights(): void;
export {};
