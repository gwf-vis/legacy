import { Component, Host, h, ComponentInterface, Element, Prop, Event, EventEmitter } from '@stencil/core';

export interface TreeNode {
  name: string;
  children?: TreeNode[];
  [x: string]: any;
}

@Component({
  tag: 'app-tree-view',
  styleUrl: 'app-tree-view.css',
  shadow: true,
})
export class AppTreeView implements ComponentInterface {
  @Element() hostElement: HTMLAppTreeViewElement;

  @Prop() data?: TreeNode;

  @Event() itemClicked: EventEmitter<TreeNode>;
  @Event() itemRightClicked: EventEmitter<TreeNode>;

  render() {
    return <Host>{this.renderTreeNode(this.data, true)}</Host>;
  }

  private renderTreeNode(treeNode: TreeNode, root?: boolean) {
    return (
      <ul id={root ? 'tree-root' : ''} class={root ? '' : 'nested'}>
        {treeNode?.children?.map(childNode =>
          childNode.children ? (
            <li
              onClick={event => {
                event.cancelBubble = true;
                this.itemClicked.emit(childNode);
              }}
              onContextMenu={event => {
                event.cancelBubble = true;
                event.preventDefault();
                this.itemRightClicked.emit(childNode);
              }}
            >
              <span
                class="caret"
                onClick={event => {
                  const target = event.currentTarget as HTMLSpanElement;
                  target.parentElement.querySelector('.nested').classList.toggle('active');
                  target.classList.toggle('caret-down');
                }}
              >
                {childNode.name}
              </span>
              {this.renderTreeNode(childNode)}
            </li>
          ) : (
            <li
              onClick={event => {
                event.cancelBubble = true;
                this.itemClicked.emit(childNode);
              }}
              onContextMenu={event => {
                event.cancelBubble = true;
                event.preventDefault();
                this.itemRightClicked.emit(childNode);
              }}
            >
              {childNode.name}
            </li>
          ),
        )}
      </ul>
    );
  }
}
