"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

Object.defineProperty(exports, "__esModule", {
  value: true
});

var React = require("react");

var component_1 = require("./component");

var common_1 = require("./common");

var errors_1 = require("./errors");

var PropertyEditor =
/*#__PURE__*/
function (_React$Component) {
  _inherits(PropertyEditor, _React$Component);

  function PropertyEditor(props) {
    var _this;

    _classCallCheck(this, PropertyEditor);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(PropertyEditor).call(this, props));
    _this._element = null;
    _this.state = {
      designer: _this.props.designer
    };
    return _this;
  }

  _createClass(PropertyEditor, [{
    key: "getEditors",
    value: function getEditors(designer) {
      var _this2 = this;

      if (designer == null) {
        return [];
      } // 各个控件相同的编辑器


      var commonPropEditorInfos = [];
      var selectedComponents = designer.selectedComponents;

      var _loop = function _loop(i) {
        var componentData = selectedComponents[i];
        var propEditorInfos = component_1.Component.getPropEditors(componentData);

        if (i == 0) {
          commonPropEditorInfos = propEditorInfos || [];
        } else {
          var items = [];
          commonPropEditorInfos.forEach(function (propInfo1) {
            propEditorInfos.forEach(function (propInfo2) {
              var propName1 = propInfo1.propName; //propInfo1.propNames.join('.')

              var propName2 = propInfo2.propName; //propInfo2.propNames.join('.')

              if (propInfo1.editorType == propInfo2.editorType && propName1 == propName2) {
                items.push(propInfo1);
              }
            });
          });
          commonPropEditorInfos = items;
        }
      };

      for (var i = 0; i < selectedComponents.length; i++) {
        _loop(i);
      } // 各个控件相同的属性值


      var commonFlatProps;

      for (var i = 0; i < selectedComponents.length; i++) {
        var control = selectedComponents[i];
        var controlProps = Object.assign({}, control.props);
        delete controlProps.children; // controlProps = this.flatProps(controlProps)

        if (i == 0) {
          commonFlatProps = controlProps;
        } else {
          var obj = {};

          for (var key in commonFlatProps) {
            if (commonFlatProps[key] == controlProps[key]) obj[key] = controlProps[key];
          }

          commonFlatProps = obj;
        }
      }

      var editors = [];

      var _loop2 = function _loop2(_i) {
        var propEditorInfo = commonPropEditorInfos[_i];
        var propName = propEditorInfo.propName;
        ;
        var editorType = propEditorInfo.editorType;

        var value = _this2.propValue(propName, commonFlatProps);

        var editorProps = {
          value: value,
          editComponents: selectedComponents,
          updateComponentProp: function updateComponentProp(value) {
            var componentProps = selectedComponents.map(function (o) {
              return {
                componentId: o.props.id,
                propName: propEditorInfo.propName,
                value: value
              };
            });
            designer.updateComponentProps.apply(designer, _toConsumableArray(componentProps));
          }
        };
        var editor = React.createElement(editorType, editorProps);
        editors.push({
          prop: propEditorInfo.propName,
          editor: editor,
          group: propEditorInfo.group
        });
      };

      for (var _i = 0; _i < commonPropEditorInfos.length; _i++) {
        _loop2(_i);
      }

      return editors;
    }
  }, {
    key: "propValue",
    value: function propValue(propName, props) {
      if (!propName) throw errors_1.Errors.argumentNull("propName");
      if (!props) throw errors_1.Errors.argumentNull("props");
      var navPropsNames = propName.split(".");
      var obj = props;

      for (var i = 0; i < navPropsNames.length; i++) {
        obj = obj[navPropsNames[i]];
        if (obj == null) return null;
      }

      return obj;
    }
  }, {
    key: "render",
    value: function render() {
      var designer = this.state.designer;
      var editors = this.getEditors(designer);

      if (editors.length == 0) {
        var empty = this.props.empty;
        return React.createElement("div", {
          className: "text-center"
        }, empty);
      }

      if (this.props.customRender) {
        var items = editors.map(function (o) {
          return Object.assign({
            displayName: common_1.proptDisplayNames[o.prop] || o.prop
          }, o);
        });
        var r = this.props.customRender(designer.selectedComponents, items);

        if (r != null) {
          return r;
        }
      }

      var groupEditorsArray = [];

      var _loop3 = function _loop3(i) {
        var group = editors[i].group || '';
        var groupEditors = groupEditorsArray.filter(function (o) {
          return o.group == group;
        })[0];

        if (groupEditors == null) {
          groupEditors = {
            group: editors[i].group,
            editors: []
          };
          groupEditorsArray.push(groupEditors);
        }

        groupEditors.editors.push({
          prop: editors[i].prop,
          editor: editors[i].editor
        });
      };

      for (var i = 0; i < editors.length; i++) {
        _loop3(i);
      }

      return React.createElement(React.Fragment, null, groupEditorsArray.map(function (g) {
        return React.createElement("div", {
          key: g.group,
          className: "panel panel-default"
        }, g.group ? React.createElement("div", {
          className: "panel-heading"
        }, common_1.proptDisplayNames[g.group] || g.group) : null, React.createElement("div", {
          className: "panel-body"
        }, g.editors.map(function (o, i) {
          return React.createElement("div", {
            key: o.prop,
            className: "form-group clearfix"
          }, React.createElement("label", null, common_1.proptDisplayNames[o.prop] || o.prop), React.createElement("div", {
            className: "control"
          }, React.createElement(component_1.ErrorBoundary, null, o.editor)));
        })));
      }));
    }
  }, {
    key: "element",
    get: function get() {
      return this._element;
    }
  }], [{
    key: "getDerivedStateFromProps",
    value: function getDerivedStateFromProps(props, state) {
      return {
        designer: props.designer
      };
    }
  }]);

  return PropertyEditor;
}(React.Component);

exports.PropertyEditor = PropertyEditor;
//# sourceMappingURL=property-editor.js.map
