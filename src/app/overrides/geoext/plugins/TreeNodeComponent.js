/** private: method[onRenderNode]
 *  :param node: ``Ext.tree.TreeNode``
 */
// Reasons for override:
// - initial collapse of the legend for each node

GeoExt.plugins.TreeNodeComponent.prototype.onRenderNode = function(node) {
  var rendered = node.rendered;
  var attr = node.attributes;
  var component = attr.component || this.component;
  if(!rendered && component) {
      // We're initially hiding the component
      component.hidden=true;
      var elt = Ext.DomHelper.append(node.ui.elNode, [
    {"tag": "div"}
      ]);
      if(typeof component == "function") {
    component = component(node, elt);
      } else if (typeof component == "object" &&
           typeof component.fn == "function") {
    component = component.fn.apply(
        component.scope, [node, elt]
    );
      }
      if(typeof component == "object" &&
         typeof component.xtype == "string") {
    component = Ext.ComponentMgr.create(component);
      }
      if(component instanceof Ext.Component) {
    component.render(elt);
    node.component = component;
      }
  }
};

