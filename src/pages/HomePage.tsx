import { IonAvatar, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonItem, IonPage, IonToolbar } from '@ionic/react';
import { add, chatbubbles } from 'ionicons/icons';
import DebateAddModal from '../components/DebateAddModal';
import DebateCard from '../components/DebateCard';
import { useEffect, useState } from 'react';
import './HomePage.css';
import { PageData } from '../AppData';

interface ContainerProps {
    pageData: PageData;
}

const HomePage: React.FC<ContainerProps> = ({ pageData }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [debates, setDebates] = useState(pageData.debates.entries());

    useEffect(() => {
        return pageData.onInit(() => {
            pageData.debates.load();
        });
    }, []);

    useEffect(() => {
        return pageData.debates.onUpdated(() => { setDebates(pageData.debates.entries()); });
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
                {debates.map(d => <DebateCard key={d._id} pageData={pageData} id={d._id} />)}
            </IonContent>
            <IonFab slot="fixed" vertical="bottom" horizontal="end">
                <IonFabButton onClick={() => setIsOpen(true)}>
                    <IonIcon icon={add} />
                </IonFabButton>
            </IonFab>
            <DebateAddModal pageData={pageData} isOpen={isOpen} setIsOpen={setIsOpen} />
        </IonPage>
    );
};

export default HomePage;
