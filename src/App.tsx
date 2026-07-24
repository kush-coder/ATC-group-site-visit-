import React from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import { AppProvider } from '@/hooks/AppContext';

import Splash from '@/pages/Splash/Splash';
import EmployeeSetup from '@/pages/EmployeeSetup/EmployeeSetup';
import PinLogin from '@/pages/PinLogin/PinLogin';
import Dashboard from '@/pages/Dashboard/Dashboard';
import NewVisit from '@/pages/NewVisit/NewVisit';
import VisitDetails from '@/pages/VisitDetails/VisitDetails';
import TodayVisits from '@/pages/TodayVisits/TodayVisits';
import AllVisits from '@/pages/AllVisits/AllVisits';
import FollowUps from '@/pages/FollowUps/FollowUps';
import Reports from '@/pages/Reports/Reports';
import Settings from '@/pages/Settings/Settings';
import Profile from '@/pages/Profile/Profile';
import BackupRestore from '@/pages/BackupRestore/BackupRestore';
import StorageManagement from '@/pages/StorageManagement/StorageManagement';
import About from '@/pages/About/About';

setupIonicReact({ mode: 'md' });

const App: React.FC = () => (
  <IonApp>
    <AppProvider>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/splash" component={Splash} />
          <Route exact path="/setup" component={EmployeeSetup} />
          <Route exact path="/pin" component={PinLogin} />
          <Route exact path="/dashboard" component={Dashboard} />
          <Route exact path="/visit/new" component={NewVisit} />
          <Route exact path="/visit/edit/:id" component={NewVisit} />
          <Route exact path="/visit/:id" component={VisitDetails} />
          <Route exact path="/today" component={TodayVisits} />
          <Route exact path="/visits" component={AllVisits} />
          <Route exact path="/followups" component={FollowUps} />
          <Route exact path="/reports" component={Reports} />
          <Route exact path="/settings" component={Settings} />
          <Route exact path="/profile" component={Profile} />
          <Route exact path="/backup" component={BackupRestore} />
          <Route exact path="/storage" component={StorageManagement} />
          <Route exact path="/about" component={About} />
          <Route exact path="/">
            <Redirect to="/splash" />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </AppProvider>
  </IonApp>
);

export default App;
