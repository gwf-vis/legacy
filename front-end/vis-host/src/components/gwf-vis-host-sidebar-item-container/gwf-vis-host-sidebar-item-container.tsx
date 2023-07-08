import { Component, Host, h, ComponentInterface, Prop } from '@stencil/core';

@Component({
  tag: 'gwf-vis-host-sidebar-item-container',
  styleUrl: 'gwf-vis-host-sidebar-item-container.css',
  shadow: true,
})
export class GwfVisHostSidebarItemContainer implements ComponentInterface {
  @Prop() header: string;
  @Prop() containerProps?: { slot?: string };

  render() {
    return (
      <Host slot={this.containerProps?.slot}>
        {this.containerProps?.slot === 'top' ? this.renderContent() : <gwf-vis-host-collapse>{this.renderContent()}</gwf-vis-host-collapse>}
      </Host>
    );
  }

  private renderContent() {
    return [
      <div part="header" slot={this.containerProps?.slot === 'top' ? '' : 'header'} innerHTML={this.header}></div>,
      <div part="content">
        <slot></slot>
      </div>,
    ];
  }
}
