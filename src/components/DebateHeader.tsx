import { IonAvatar, IonHeader, IonIcon, IonItem, IonToolbar } from '@ionic/react';
import './DebateHeader.css';
import { chatbubbles } from 'ionicons/icons';

const DebateHeader: React.FC = () => {
    return (
        <IonHeader>
            <IonToolbar>
                <IonItem>
                    <IonAvatar slot="start"><img src="https://ionicframework.com/docs/img/demos/avatar.svg" /></IonAvatar>
                    <IonIcon className="app-icon" icon={chatbubbles}></IonIcon>
                </IonItem>
            </IonToolbar>
        </IonHeader>
    );
};

export default DebateHeader;