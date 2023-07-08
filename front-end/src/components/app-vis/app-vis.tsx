import { Component, Host, h, ComponentInterface, Element, Prop, Env, State } from '@stencil/core';
import 'gwf-vis-host';

@Component({
  tag: 'app-vis',
  styleUrl: 'app-vis.css',
  shadow: true,
})
export class AppVis implements ComponentInterface {
  @Element() hostElement: HTMLAppVisElement;

  @State() data: any;

  @Prop() pluginUrl = `${Env.SERVER_BASE_URL}/files/public/plugins/vis-main`;
  @Prop() user: string;
  @Prop() visId: string;

  async componentDidLoad() {
    this.data = await (await fetch(`${Env.SERVER_BASE_URL}/file/vis?user=${this.user}&id=${this.visId}`)).json();
  }

  render() {
    return <Host>{this.data && <gwf-vis-host serverFileApiBasePath={`${Env.SERVER_BASE_URL}/file/fetch`} {...this.data}></gwf-vis-host>}</Host>;
  }
}
