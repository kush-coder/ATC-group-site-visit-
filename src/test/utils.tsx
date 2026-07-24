/**
 * Test render helper. Wraps a page component in IonApp + a v5 MemoryRouter so
 * useHistory / useParams resolve, matching a route (with params where needed).
 */
import React from 'react';
import { render } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';

interface Options {
  route?: string;
  path?: string;
}

export function renderPage(Component: React.ComponentType<any>, { route = '/', path }: Options = {}) {
  return render(
    <IonApp>
      <MemoryRouter initialEntries={[route]}>
        <Route path={path ?? route} component={Component} />
      </MemoryRouter>
    </IonApp>
  );
}

export * from '@testing-library/react';
