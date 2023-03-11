import { IonAvatar, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonItem, IonPage, IonToolbar } from '@ionic/react';
import { add, chatbubbles } from 'ionicons/icons';
import DebateAddModal from '../components/DebateAddModal';
import DebateCard from '../components/DebateCard';
import { useEffect, useState } from 'react';
import './HomePage.css';
import { AppData } from '../AppData';

interface ContainerProps {
    appData: AppData;
}

const HomePage: React.FC<ContainerProps> = ({ appData }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [debates, setDebates] = useState(appData.debates());

    useEffect(() => {
        appData.loadDebates();
        return appData.onInit(() => {
            appData.loadDebates();
        });
    }, []);

    useEffect(() => {
        return appData.onDebatesUpdated(() => { setDebates(appData.debates()); });
    }, []);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonItem>
                        <IonAvatar slot="start"><img src="https://ionicframework.com/docs/img/demos/avatar.svg" /></IonAvatar>
                        <IonIcon className="app-icon" icon={chatbubbles}></IonIcon>
                    </IonItem>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                {debates.map(d => <DebateCard key={d._id} appData={appData} id={d._id} />)}
            </IonContent>
            <IonFab slot="fixed" vertical="bottom" horizontal="end">
                <IonFabButton onClick={() => setIsOpen(true)}>
                    <IonIcon icon={add} />
                </IonFabButton>
            </IonFab>
            <DebateAddModal appData={appData} isOpen={isOpen} setIsOpen={setIsOpen} />
        </IonPage>
    );
};

export default HomePage;
