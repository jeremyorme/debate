import { Redirect, Route } from 'react-router-dom';
import {
    IonApp,
    IonIcon,
    IonLabel,
    IonRouterOutlet,
    IonTabBar,
    IonTabButton,
    IonTabs,
    setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { ellipse, homeSharp, square } from 'ionicons/icons';
import HomePage from './pages/HomePage';
import Tab2 from './pages/Tab2';
import Tab3 from './pages/Tab3';
import { BononoDb, IDbClient } from 'bonono-react';
import { AppData } from './app-data/AppData';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import './App.css';
import { useState } from 'react';
import MessagesPage from './pages/MessagesPage';
import PresentationsPage from './pages/PresentationsPage';

setupIonicReact();

const App: React.FC = () => {
    const [appData] = useState(new AppData());

    const loadDb = async (dbClient: IDbClient | null) => {
        if (!dbClient)
            return;

        if (!await dbClient.connect())
            return;

        const publicKey = dbClient.publicKey();
        if (!publicKey)
            return;

        const db = await dbClient.db("debate-app");
        if (!db)
            return;

        appData.init(db, publicKey);
    };

    return <IonApp>
        <BononoDb address="/dns4/nyk.webrtc-star.bonono.org/tcp/443/wss/p2p-webrtc-star/" onDbClient={e => loadDb(e.detail)} />
        <IonReactRouter>
            <IonTabs>
                <IonRouterOutlet>
                    <Route exact path="/home">
                        <HomePage pageData={appData.home} />
                    </Route>
                    <Route exact path="/tab2">
                        <Tab2 />
                    </Route>
                    <Route path="/tab3">
                        <Tab3 />
                    </Route>
                    <Route path="/debate/:id/messages/:side">
                        <MessagesPage pageData={appData.messages} />
                    </Route>
                    <Route path="/debate/:id/presentations">
                        <PresentationsPage pageData={appData.presentations} />
                    </Route>
                    <Route exact path="/">
                        <Redirect to="/home" />
                    </Route>
                </IonRouterOutlet>
                <IonTabBar slot="bottom">
                    <IonTabButton tab="home" href="/home">
                        <IonIcon icon={homeSharp} />
                        <IonLabel>Home</IonLabel>
                    </IonTabButton>
                    <IonTabButton tab="tab2" href="/tab2">
                        <IonIcon icon={ellipse} />
                        <IonLabel>Tab 2</IonLabel>
                    </IonTabButton>
                    <IonTabButton tab="tab3" href="/tab3">
                        <IonIcon icon={square} />
                        <IonLabel>Tab 3</IonLabel>
                    </IonTabButton>
                </IonTabBar>
            </IonTabs>
        </IonReactRouter>
    </IonApp>;
};

export default App;
