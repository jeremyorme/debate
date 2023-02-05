import { IonBackButton, IonButton, IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonPage, IonRow, IonTitle, IonToolbar } from "@ionic/react";
import { arrowForwardSharp } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { AppData, dbEntryDefaults, IMessage } from "../AppData";
import DebateCard from "../components/DebateCard";
import { findUrl } from "../Utils";
import './MessagesPage.css';

interface ContainerProps {
    appData: AppData;
}

interface ContainerParams {
    id: string;
    side: string;
}

const MessagesPage: React.FC<ContainerProps> = ({ appData }) => {
    const { id, side } = useParams<ContainerParams>();
    const [debateTitle, setDebateTitle] = useState(appData.debateTitle(id));
    const [messages, setMessages] = useState(appData.messages(side));
    const [description, setDescription] = useState('');

    useEffect(() => {
        appData.loadMessages(id, side);
        return appData.onDebatesUpdated(() => {
            setDebateTitle(appData.debateTitle(id));
            appData.loadMessages(id, side);
        });
    }, []);

    useEffect(() => {
        return appData.onMessages(side, () => {
            setMessages(appData.messages(side))
        });
    }, []);

    const updateDescription = (value: string | null | undefined) => {
        if (!value && value != '')
            return;

        setDescription(value);
    };

    const addMessage = () => {
        const message: IMessage = {
            ...dbEntryDefaults,
            description,
        };
        appData.addMessage(side, message);
        setDescription('');
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/home" />
                    </IonButtons>
                    <IonTitle>{side.charAt(0).toUpperCase() + side.slice(1)}: {debateTitle}</IonTitle>
                </IonToolbar>
                <IonGrid>
                    <IonRow>
                        <IonCol>
                            <IonInput placeholder="What do you think?" value={description} onIonChange={e => updateDescription(e.detail.value)} />
                        </IonCol>
                        <IonCol size="auto">
                            <IonButton fill="clear" disabled={description.length == 0} onClick={() => addMessage()}>
                                <IonIcon icon={arrowForwardSharp} />
                            </IonButton>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonHeader>
            <IonContent>
                {messages.map(m => <DebateCard key={m._id} username={m._identity.publicKey.slice(-8)} description={m.description} url={findUrl(m.description)} />)}
            </IonContent>
        </IonPage >
    );
};

export default MessagesPage;
