import { IonContent, IonFab, IonFabButton, IonIcon, IonPage } from '@ionic/react';
import { add } from 'ionicons/icons';
import DebateAddModal from '../components/DebateAddModal';
import DebateCard from '../components/DebateCard';
import DebateHeader from '../components/DebateHeader';
import { useEffect, useState } from 'react';
import './HomePage.css';
import { AppData } from '../AppData';
import { findUrl } from '../Utils';

interface ContainerProps {
    appData: AppData;
}

const HomePage: React.FC<ContainerProps> = ({ appData }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [debates, setDebates] = useState(appData.debates());

    useEffect(() => {
        return appData.onDebatesUpdated(() => { setDebates(appData.debates()); });
    }, []);

    return (
        <IonPage>
            <DebateHeader />
            <IonContent fullscreen>
                {debates.map(d => <DebateCard key={d._id} id={d._id} username={d._identity.publicKey.slice(-8)} title={d.title} description={d.description} url={findUrl(d.description)} />)}
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
