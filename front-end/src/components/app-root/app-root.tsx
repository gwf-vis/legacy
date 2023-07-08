import { Component, h } from '@stencil/core';

@Component({
  tag: 'app-root',
  styleUrl: 'app-root.css',
  scoped: true,
})
export class AppRoot {
  render() {
    return (
      <ion-app>
        <ion-router useHash={true}>
          <ion-route url="/" component="app-home" />
          <ion-route url="/vis/:user/:visId" component="app-vis" />
        </ion-router>
        <ion-nav />
      </ion-app>
    );
  }
}
