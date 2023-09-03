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
import { DbClient, IDbClient } from 'bonono';
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

import { useEffect, useState } from 'react';
import MessagesPage from './pages/MessagesPage';
import PresentationsPage from './pages/PresentationsPage';
import UserPage from './pages/UserPage';

setupIonicReact();

const g = globalThis as any;
const createHelia = g.Helia.createHelia;
const json = g.HeliaJson.json;
const MemoryBlockstore = g.BlockstoreCore.MemoryBlockstore;
const MemoryDatastore = g.DatastoreCore.MemoryDatastore;
const createLibp2p = g.Libp2P.createLibp2p;
const webRTCDirect = g.Libp2PWebrtc.webRTCDirect;
const noise = g.ChainsafeLibp2PNoise.noise;
const yamux = g.ChainsafeLibp2PYamux.yamux;
const gossipsub = g.ChainsafeLibp2PGossipsub.gossipsub;
const CID = g.Multiformats.CID;

const App: React.FC = () => {
    const [appData] = useState(new AppData());

    const loadDb = async () => {
        const address = "/dns4/nyk.webrtc-star.bonono.org/tcp/443/wss/p2p-webrtc-star/";

        // the blockstore is where we store the blocks that make up files
        const blockstore = new MemoryBlockstore()

        // application-specific data lives in the datastore
        const datastore = new MemoryDatastore()

        // libp2p is the networking layer that underpins Helia
        const libp2p = await createLibp2p({
            datastore,
            addresses: {
                swarm: [address]
            },
            transports: [
                webRTCDirect()
            ],
            connectionEncryption: [
                noise()
            ],
            streamMuxers: [
                yamux()
            ],
            services: {
                pubsub: gossipsub()
            }
        });

        // Set up Helia and create call-back functions
        const helia = await createHelia({
            datastore,
            blockstore,
            libp2p
        });

        const j = json(helia);

        const putObject = async (obj: any): Promise<string> => {
            const cid = await j.add(JSON.stringify(obj));
            return cid.toString();
        }

        const getObject = async (cid: string): Promise<any> => {
            const obj = await j.get(CID.parse(cid));
        }

        const peerId = libp2p.peerId.toString();

        const publish = (channel: string, content: string) => {
            libp2p.services.pubsub.publish(channel, new TextEncoder().encode(content));
        }

        const addMessageListener = (listener: (channel: string, content: string) => void) => {
            return libp2p.services.pubsub.addEventListener('message', (e: any) => {
                listener(e.detail.topic, new TextDecoder().decode(e.detail.data));
            });
        }

        const subscribe = (channel: string) => {
            libp2p.services.pubsub.subscribe(channel);
        }

        const dbClient: IDbClient = new DbClient(
            peerId, publish, subscribe, addMessageListener, getObject, putObject);

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

    useEffect(() => {
        loadDb();
    }, []);

    return <IonApp>
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
                    <Route path="/user/:id">
                        <UserPage pageData={appData.user} />
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
