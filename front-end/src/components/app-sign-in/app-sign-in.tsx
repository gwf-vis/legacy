import { Component, Host, h, Env } from '@stencil/core';
import { popoverController } from '@ionic/core';

@Component({
  tag: 'app-sign-in',
  styleUrl: 'app-sign-in.css',
  shadow: true,
})
export class AppSignIn {

  render() {
    return (
      <Host>
        <form onSubmit={async event => {
          event.preventDefault();
          const target = event.currentTarget as HTMLFormElement;
          const username = target.username.value;
          const password = target.password.value;
          await fetch(
            `${Env.SERVER_BASE_URL}/auth/sign-in`,
            {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ username, password })
            }
          );
          await popoverController.dismiss({}, '', 'sign-in');
        }}>
          <ion-item>
            <ion-label>Username</ion-label>
            <ion-input name="username" required />
          </ion-item>
          <ion-item>
            <ion-label>Password</ion-label>
            <ion-input name="password" required type="password" />
          </ion-item>
          <ion-button
            type="submit"
            expand="block"
          >Sign In</ion-button>
        </form>
      </Host>
    );
  }

}
