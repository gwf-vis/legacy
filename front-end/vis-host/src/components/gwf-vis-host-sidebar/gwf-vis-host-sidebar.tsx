import { Component, Host, h, ComponentInterface, Prop } from '@stencil/core';

@Component({
  tag: 'gwf-vis-host-sidebar',
  styleUrl: 'gwf-vis-host-sidebar.css',
  shadow: true,
})
export class GwfVisHostSidebar implements ComponentInterface {
  @Prop({ reflect: true, mutable: true }) active: boolean = true;

  render() {
    return (
      <Host>
        <input
          id="toggle"
          hidden
          type="checkbox"
          checked={this.active}
          title={this.active ? 'Hide Sidebar' : 'Show Sidebar'}
          onChange={({ currentTarget }) => (this.active = (currentTarget as HTMLInputElement).checked)}
        />
        <label part="toggle" htmlFor="toggle" title={this.active ? 'Hide Sidebar' : 'Show Sidebar'}></label>
        <div part="container">
          <div part="inner-container">
            <div style={{ overflow: 'auto', flex: '0 0 auto', maxHeight: '50%' }}>
              <slot name="top"></slot>
            </div>
            <div style={{ overflowY: 'auto', flex: '0 0 1' }}>
              <slot></slot>
            </div>
          </div>
        </div>
      </Host>
    );
  }
}
