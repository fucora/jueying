import React = require("react");

import { ComponentData } from "./models";
import { Callback, guid } from "./common";
import { Errors } from "./errors";
import { Component } from "./component";
import { appendClassName, classNames } from "./style";
import { ComponentWrapper } from "./component-wrapper";
import { ComponentFactory } from "./component-factory";
import { ComponentProps } from "maishu-jueying-core";
import { ComponentDataHandler } from "./component-data-handler";

export interface PageDesignerProps extends React.Props<PageDesigner> {
    // pageData: ComponentData | null,
    style?: React.CSSProperties,
    className?: string,
    componentFactory?: ComponentFactory,
    elementTag?: string;
    context?: any,
    componentDataHandler: ComponentDataHandler
}

export interface PageDesignerState {
    pageData: ComponentData | null,
}

export class PageDesigner<P extends PageDesignerProps = PageDesignerProps, S extends PageDesignerState = PageDesignerState>
    extends React.Component<P, S> {
    private _element: HTMLElement;

    // componentSelected: Callback<string[]> = Callback.create<string[]>();
    // componentRemoved: Callback<string[]> = Callback.create<string[]>()
    // componentAppend: Callback<PageDesigner> = Callback.create<PageDesigner>()
    // componentUpdated: Callback<ComponentData[]> = Callback.create<ComponentData[]>()

    // designtimeComponentDidMount = Callback.create<{ component: React.ReactElement<any>, element: HTMLElement }>();

    static defaultProps: PageDesignerProps = { componentDataHandler: null };
    private components: { [typeName: string]: React.Component[] } = {};

    constructor(props: P) {
        super(props);

        let pageData = this.props.componentDataHandler.pageData;
        this.initPageData(pageData);

        this.state = { pageData } as S;

        this.props.componentDataHandler.componentSelected.add(args => {
            // this.componentSelected.fire(args);
            this.setState({ pageData: this.props.componentDataHandler.pageData });
        })
        this.props.componentDataHandler.componentRemoved.add(args => {
            // this.componentRemoved.fire(args);
            this.setState({ pageData: this.props.componentDataHandler.pageData });
        })
        this.props.componentDataHandler.componentUpdated.add(args => {
            // this.componentUpdated.fire(args);
            this.setState({ pageData: this.props.componentDataHandler.pageData });
        })

        this.props.componentDataHandler.pageDataChanged.add(args => {
            this.setState({ pageData: args });
        })

        // this.componentAppend = Callback.create();
        // this.props.componentDataHandler.componentAppend.add(() => this.componentAppend.fire(this));

    }

    private setComponetRefProp(pageData: ComponentData) {

        //=========================================================
        // 纪录当前 pageData 控件 ID
        let componentIds: { [typeName: string]: string[] } = {};
        //=========================================================
        PageDesigner.travelComponentData(pageData).forEach(item => {

            console.assert(item.props != null && item.id != null);
            componentIds[item.type] = componentIds[item.type] || [];
            componentIds[item.type].push(item.props["id"] as string);

            let itemRef = item.props.ref;
            item.props.ref = (e) => {
                if (e != null) {
                    this.components[item.type] = this.components[item.type] || [];
                    this.components[item.type].push(e);
                }

                if (typeof itemRef == "function")
                    itemRef(e);
            }
        })

        //=========================================================
        // 仅保留 componentIds 中的控件 
        let names = Object.getOwnPropertyNames(this.components);
        for (let i = 0; i < names.length; i++) {
            let typename = names[i];
            let ids = componentIds[typename] || [];
            this.components[typename] = (this.components[typename] || []).filter(o => ids.indexOf(o["id"] || o.props["id"]) >= 0)
        }
        //=========================================================
    }

    private initPageData(pageData: ComponentData) {
        if (pageData == null) {
            return
        }

        pageData.children = pageData.children || [];
        // PageDesigner.nameComponent(pageData);
        this.setComponetRefProp(pageData);

    }

    allComponents(): React.Component[] {
        let r: React.Component[] = [];
        for (let key in this.components) {
            r.push(...this.components[key]);
        }
        return r;
    }

    /** 页面数据 */
    get pageData() {
        return this.state.pageData;
    }

    /** 获取已选择了的组件编号 */
    get selectedComponentIds() {
        return this.selectedComponents.map(o => o.id)
    }

    /** 获取已选择了的组件 */
    get selectedComponents(): ComponentData[] {
        return this.props.componentDataHandler.selectedComponents;
    }

    get element(): HTMLElement {
        return this._element;
    }

    updateComponentProp(componentId: string, propName: string, value: any): any {
        return this.updateComponentProps({ componentId, propName, value });
    }
    updateComponentProps(...componentProps: { componentId: string, propName: string, value: any }[]): any {
        this.props.componentDataHandler.updateComponentProps(componentProps);
    }

    // /**
    //  * 对组件及其子控件进行命名
    //  * @param component 
    //  */
    // private static nameComponent(component: ComponentData) {
    //     let namedComponents: { [key: string]: ComponentData } = {}
    //     let props = component.props = component.props || {};
    //     if (!props.name) {
    //         let num = 0;
    //         let name: string;
    //         do {
    //             num = num + 1;
    //             name = `${component.type}${num}`;
    //         } while (namedComponents[name]);

    //         namedComponents[name] = component
    //         props.name = name;
    //     }

    //     if (!props.id)
    //         props.id = guid();

    //     if (!component.children || component.children.length == 0) {
    //         return;
    //     }

    //     component.children.forEach(child => {
    //         if (typeof child == "string")
    //             return true;

    //         PageDesigner.nameComponent(child);
    //     })
    // }

    /** 
     * 添加控件 
     * @param parentId 父控件编号
     * @param componentData 控件数据
     * @param componentIndex 新添加组件在子组件中的次序 
     */
    appendComponent(parentId: string, componentData: ComponentData, componentIndex?: number) {
        this.props.componentDataHandler.appendComponent(parentId, componentData, componentIndex);
    }

    /** 
     * 设置控件位置
     * @param componentId 组件编号
     * @param position 组件位置 
     */
    setComponentPosition(componentId: string, position: { left: number | string, top: number | string }) {
        return this.setComponentsPosition([{ componentId, position }])
    }

    /** 
     * 设置控件大小
     * @param componentId 组件编号
     * @param size 组件大小 
     */
    setComponentSize(componentId: string, size: { width?: number | string, height?: number | string }) {
        console.assert(componentId != null)
        console.assert(size != null)

        let componentData = this.findComponentData(componentId);
        if (!componentData)
            throw new Error(`Control ${componentId} is not exits.`);

        let style = componentData.props.style = (componentData.props.style || {});
        if (size.height)
            style.height = size.height

        if (size.width)
            style.width = size.width

        let { pageData } = this.state;
        this.setState({ pageData });

        // this.componentUpdated.fire([componentData])
    }

    setComponentsPosition(positions: { componentId: string, position: { left: number | string, top: number | string } }[]) {
        let toUpdateProps: { componentId: string, propName: string, value: any }[] = [];
        positions.forEach(o => {
            let { componentId } = o
            let { left, top } = o.position
            let componentData = this.props.componentDataHandler.findComponentData(componentId);
            if (!componentData)
                throw new Error(`Control ${componentId} is not exits.`);

            let style = componentData.props.style = (componentData.props.style || {});
            if (left)
                style.left = left;

            if (top)
                style.top = top;

            toUpdateProps.push({ componentId, propName: "style", value: style })
        })

        this.props.componentDataHandler.updateComponentProps(toUpdateProps);
    }

    /**
     * 选择指定的控件
     * @param control 指定的控件
     */
    selectComponent(componentIds: string[] | string): void {

        this.props.componentDataHandler.selectComponents(componentIds);
        //====================================================
        // 设置焦点，以便获取键盘事件
        if (this._element)
            this._element.focus()
        //====================================================
    }

    /** 移除控件 */
    removeComponent(...componentIds: string[]) {
        this.props.componentDataHandler.removeComponents(componentIds);
    }

    /** 
     * 移动控件到另外一个控件容器 
     * @param componentId 要移动的组件编号
     * @param parentId 目标组件编号
     * @param targetComponentIndex 组件位置
     */
    moveComponent(componentId: string, parentId: string, targetComponentIndex?: number) {
        return this.props.componentDataHandler.moveComponent(componentId, parentId, targetComponentIndex);
    }

    private removeComponentFrom(controlId: string, collection: ComponentData["children"]): boolean {
        let controlIndex: number | null = null;
        for (let i = 0; i < collection.length; i++) {
            let child = collection[i];
            if (typeof child == "string")
                continue;

            if (controlId == child.id) {
                controlIndex = i;
                break;
            }
        }

        if (controlIndex == null) {
            for (let i = 0; i < collection.length; i++) {
                let o = collection[i];
                if (typeof o == "string")
                    continue;

                let children = o.children || [];
                children.forEach(child => {
                    if (typeof child == "string")
                        return true;

                    let isRemoved = this.removeComponentFrom(controlId, children);
                    if (isRemoved) {
                        return true;
                    }
                })
            }

            return false;
        }

        if (controlIndex == 0) {
            collection.shift();
        }
        else if (controlIndex == collection.length - 1) {
            collection.pop();
        }
        else {
            collection.splice(controlIndex, 1);
        }

        return true;
    }

    private static travelComponentData(pageData: ComponentData, filter?: (item: ComponentData) => boolean): ComponentData[] {
        let stack = new Array<ComponentData>();
        stack.push(pageData);
        let r: ComponentData[] = [];
        // return new Promise((resolve, reject) => {
        filter = filter || (() => true);
        while (stack.length > 0) {
            let item = stack.shift();
            if (filter(item)) {
                r.push(item);
            }

            //===============================================
            // 子元素有可能为字符串, 过滤出对象
            let children = (item.children || []).filter(o => typeof o == 'object') as ComponentData[]
            //===============================================
            stack.push(...children);
        }

        return r;
    }

    findComponentData(componentId: string): ComponentData | null {
        return this.props.componentDataHandler.findComponentData(componentId);
    }

    private onKeyDown(e: React.KeyboardEvent<HTMLElement>) {
        const DELETE_KEY_CODE = 46;
        if (e.keyCode == DELETE_KEY_CODE) {
            if (this.selectedComponents.length == 0)
                return

            this.props.componentDataHandler.removeComponents(this.selectedComponentIds)
        }
    }

    protected createDesignTimeElement(type: string | React.ComponentClass<any>, props: ComponentProps<any>, ...children: any[]) {

        if (type == null) throw Errors.argumentNull('type')
        if (props == null) throw Errors.argumentNull('props')
        if (props.id == null) throw Errors.argumentFieldCanntNull('id', 'props')


        console.assert(props.id != null)
        if (props.id != null)
            props.key = props.id;

        //===================================================
        // 获取对象的 ComponentAttribute ，以从对象 props 中获取的为准

        let attr1 = Component.getAttribute(type)
        console.assert(attr1 != null)

        let attr2 = props.attr || {}
        let attr = Object.assign({}, attr1, attr2)
        delete props.attr
        //===================================================

        let className = props.selected ? appendClassName(props.className || '', classNames.componentSelected) : props.className

        let wrapperProps = Object.assign({}, props);
        delete wrapperProps.ref;
        wrapperProps.className = className;

        return <ComponentWrapper {...wrapperProps} designer={this}
            source={{ type, attr, props, children }}>
        </ComponentWrapper>
    }

    static getDerivedStateFromProps(props: PageDesignerProps, state: PageDesignerState) {
        return { pageData: props.componentDataHandler.pageData } as Partial<PageDesignerState>;
    }

    render() {
        let { pageData } = this.state
        let style = this.props.style
        let elementTag: string = this.props.elementTag || "div";
        let result = React.createElement(elementTag, {
            className: classNames.designer, tabIndex: 1, style,
            ref: (e: HTMLElement) => {
                if (!e) return;
                this._element = e || this._element;
                this.props.componentFactory.renderDesignTimeComponent(pageData, e, { handler: this.props.componentDataHandler });
            },
            onKeyDown: (t) => this.onKeyDown(t)
        })

        return result;
    }
}