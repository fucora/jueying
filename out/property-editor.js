"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const component_1 = require("./component");
const common_1 = require("./common");
const errors_1 = require("./errors");
class PropertyEditor extends React.Component {
    constructor(props) {
        super(props);
        this._element = null;
        this.state = { designer: this.props.designer };
    }
    static getDerivedStateFromProps(props, state) {
        return { designer: props.designer };
    }
    getEditors(designer) {
        if (designer == null) {
            return [];
        }
        // 各个控件相同的编辑器
        let commonPropEditorInfos = [];
        let selectedComponents = designer.selectedComponents;
        for (let i = 0; i < selectedComponents.length; i++) {
            let componentData = selectedComponents[i];
            let propEditorInfos = component_1.Component.getPropEditors(componentData);
            if (i == 0) {
                commonPropEditorInfos = propEditorInfos || [];
            }
            else {
                let items = [];
                commonPropEditorInfos.forEach(propInfo1 => {
                    propEditorInfos.forEach(propInfo2 => {
                        let propName1 = propInfo1.propName; //propInfo1.propNames.join('.')
                        let propName2 = propInfo2.propName; //propInfo2.propNames.join('.')
                        if (propInfo1.editorType == propInfo2.editorType && propName1 == propName2) {
                            items.push(propInfo1);
                        }
                    });
                });
                commonPropEditorInfos = items;
            }
        }
        // 各个控件相同的属性值
        let commonFlatProps;
        for (let i = 0; i < selectedComponents.length; i++) {
            let control = selectedComponents[i];
            let controlProps = Object.assign({}, control.props);
            delete controlProps.children;
            // controlProps = this.flatProps(controlProps)
            if (i == 0) {
                commonFlatProps = controlProps;
            }
            else {
                let obj = {};
                for (let key in commonFlatProps) {
                    if (commonFlatProps[key] == controlProps[key])
                        obj[key] = controlProps[key];
                }
                commonFlatProps = obj;
            }
        }
        let editors = [];
        for (let i = 0; i < commonPropEditorInfos.length; i++) {
            let propEditorInfo = commonPropEditorInfos[i];
            let propName = propEditorInfo.propName;
            ;
            let editorType = propEditorInfo.editorType;
            let value = this.propValue(propName, commonFlatProps);
            let editorProps = {
                value: value,
                editComponents: selectedComponents,
                updateComponentProp: (value) => {
                    let componentProps = selectedComponents.map(o => ({
                        componentId: o.props.id, propName: propEditorInfo.propName, value
                    }));
                    designer.updateComponentProps(...componentProps);
                }
            };
            let editor = React.createElement(editorType, editorProps);
            editors.push({ prop: propEditorInfo.propName, editor, group: propEditorInfo.group });
        }
        return editors;
    }
    propValue(propName, props) {
        if (!propName)
            throw errors_1.Errors.argumentNull("propName");
        if (!props)
            throw errors_1.Errors.argumentNull("props");
        let navPropsNames = propName.split(".");
        let obj = props;
        for (let i = 0; i < navPropsNames.length; i++) {
            obj = obj[navPropsNames[i]];
            if (obj == null)
                return null;
        }
        return obj;
    }
    render() {
        let { designer } = this.state;
        let editors = this.getEditors(designer);
        if (editors.length == 0) {
            let empty = this.props.empty;
            return React.createElement("div", { className: "text-center" }, empty);
        }
        if (this.props.customRender) {
            let items = editors.map(o => Object.assign({ displayName: common_1.proptDisplayNames[o.prop] || o.prop }, o));
            let r = this.props.customRender(designer.selectedComponents, items);
            if (r != null) {
                return r;
            }
        }
        let groupEditorsArray = [];
        for (let i = 0; i < editors.length; i++) {
            let group = editors[i].group || '';
            let groupEditors = groupEditorsArray.filter(o => o.group == group)[0];
            if (groupEditors == null) {
                groupEditors = { group: editors[i].group, editors: [] };
                groupEditorsArray.push(groupEditors);
            }
            groupEditors.editors.push({ prop: editors[i].prop, editor: editors[i].editor });
        }
        return React.createElement(React.Fragment, null, groupEditorsArray.map((g) => React.createElement("div", { key: g.group, className: "panel panel-default" },
            g.group ? React.createElement("div", { className: "panel-heading" }, common_1.proptDisplayNames[g.group] || g.group) : null,
            React.createElement("div", { className: "panel-body" }, g.editors.map((o, i) => React.createElement("div", { key: o.prop, className: "form-group clearfix" },
                React.createElement("label", null, common_1.proptDisplayNames[o.prop] || o.prop),
                React.createElement("div", { className: "control" },
                    React.createElement(component_1.ErrorBoundary, null, o.editor))))))));
    }
    get element() {
        return this._element;
    }
}
exports.PropertyEditor = PropertyEditor;
//# sourceMappingURL=property-editor.js.map