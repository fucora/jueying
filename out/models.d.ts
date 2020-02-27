/// <reference types="react" />
import { ComponentProps } from "./component";
export interface ComponentData {
    type: string;
    props?: ComponentProps<any>;
    children?: ComponentData[];
}
export interface ComponentDefine {
    componentData: ComponentData;
    displayName: string;
    icon: string;
    introduce: string;
}
export declare type ReactComponentType = string | React.ComponentClass<any> | React.ComponentType;
export interface DragDropData {
    available: any[];
    deltaX: number;
    deltaY: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    originalX: number;
    originalY: number;
    drop: HTMLElement[];
    drap: HTMLElement;
    layerX: number;
    layerY: number;
}
