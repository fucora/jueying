import { PageDesigner } from "./page-designer";
import { ComponentData } from "./models";

export interface Context {
    designer?: PageDesigner
}

/** 组件工厂 */
export abstract class ComponentFactory {
    /** 
     * 渲染设计时组件 
     * @param compentData 组件数据
     * @param element 组件元素
     * @param context 上下文
     */
    abstract renderDesignTimeComponent<C extends Context>(compentData: ComponentData, element: HTMLElement, context?: C): void;
    
    /**
     * 渲染运行时组件
     * @param compentData 组件数据
     * @param element 组件元素
     * @param context 上下文
     */
    abstract renderRunTimeComponent<C>(compentData: ComponentData, element: HTMLElement, context?: C): void;
}