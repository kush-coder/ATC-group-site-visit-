import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Switch, Route } from 'react-router-dom';
import NewVisit from '@/pages/NewVisit/NewVisit';
import VisitDetails from '@/pages/VisitDetails/VisitDetails';

/**
 * Regression guard: "/visit/new" must resolve to the New Visit form and never
 * fall through to the "/visit/:id" details route (which previously matched it
 * with id="new" and rendered an empty skeleton).
 */
const Routes: React.FC = () => (
  <Switch>
    <Route exact path="/visit/new" component={NewVisit} />
    <Route exact path="/visit/edit/:id" component={NewVisit} />
    <Route exact path="/visit/:id(\d+)" component={VisitDetails} />
  </Switch>
);

const renderAt = (route: string) =>
  render(
    <IonApp>
      <MemoryRouter initialEntries={[route]}>
        <Routes />
      </MemoryRouter>
    </IonApp>
  );

describe('App routing', () => {
  it('resolves /visit/new to the New Visit form', async () => {
    renderAt('/visit/new');
    expect(await screen.findByText(/Step 1 of 11/)).toBeInTheDocument();
    expect(screen.getByText('New Visit')).toBeInTheDocument();
  });

  it('resolves /visit/edit/5 to the form in edit mode', async () => {
    renderAt('/visit/edit/5');
    expect(await screen.findByText('Edit Visit')).toBeInTheDocument();
  });

  it('resolves a numeric /visit/5 to the details page', async () => {
    renderAt('/visit/5');
    expect(await screen.findByText('Visit Details')).toBeInTheDocument();
    expect(screen.getByText('Client details')).toBeInTheDocument();
  });
});
