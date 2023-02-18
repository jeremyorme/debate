import { IonBackButton, IonButton, IonButtons, IonCard, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonPage, IonRow, IonTitle, IonToolbar } from "@ionic/react";
import { arrowForwardSharp, thumbsDownOutline, thumbsDownSharp, thumbsUpOutline, thumbsUpSharp } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { AppData, dbEntryDefaults, IMessage, IVote, VoteDirection } from "../AppData";
import MessageCard from "../components/MessageCard";
import { findUrl } from "../Utils";
import './MessagesPage.css';

interface ContainerProps {
    appData: AppData;
}

interface ContainerParams {
    id: string;
    side: string;
}

const PAGE_ID = 'messages-page';

const MessagesPage: React.FC<ContainerProps> = ({ appData }) => {
    const { id, side } = useParams<ContainerParams>();
    const [debateTitle, setDebateTitle] = useState(appData.debateTitle(id));
    const [messages, setMessages] = useState(appData.messages(side));
    const [description, setDescription] = useState('');
    const [ownVoteDirection, setOwnVoteDirection] = useState(appData.ownVoteDirection(id, PAGE_ID));

    useEffect(() => {
        appData.loadMessages(id, side);
        appData.loadVotes(id, PAGE_ID);
        return appData.onDebatesUpdated(() => {
            setDebateTitle(appData.debateTitle(id));
            appData.loadMessages(id, side);
            appData.loadVotes(id, PAGE_ID);
        });
    }, []);

    useEffect(() => {
        return appData.onMessages(side, () => {
            setMessages(appData.messages(side));
        });
    }, []);

    useEffect(() => {
        return appData.onVotes(id, PAGE_ID, () => {
            setOwnVoteDirection(appData.ownVoteDirection(id, PAGE_ID));
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

    const updateOwnVoteDirection = (newDirection: VoteDirection) => {
        const direction = newDirection != ownVoteDirection ? newDirection : VoteDirection.Undecided;
        const vote: IVote = {
            ...dbEntryDefaults,
            direction
        };
        appData.addVote(id, PAGE_ID, vote);
        setOwnVoteDirection(direction);
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/home" />
                    </IonButtons>
                    <IonTitle>{side.charAt(0).toUpperCase() + side.slice(1)}: {debateTitle}</IonTitle>
                    <IonButtons slot="end">
                        {side == 'against' ? <IonButton slot="icon-only" onClick={() => updateOwnVoteDirection(VoteDirection.Against)}>
                            <IonIcon icon={ownVoteDirection == VoteDirection.Against ? thumbsDownSharp : thumbsDownOutline} />
                        </IonButton> : <IonButton slot="icon-only" onClick={() => updateOwnVoteDirection(VoteDirection.For)}>
                            <IonIcon icon={ownVoteDirection == VoteDirection.For ? thumbsUpSharp : thumbsUpOutline} />
                        </IonButton>}
                    </IonButtons>
                </IonToolbar>
                <IonCard>
                    <IonGrid>
                        <IonRow>
                            <IonCol>
                                <IonInput placeholder="What do you think?" value={description} onIonChange={e => updateDescription(e.detail.value)} />
                            </IonCol>
                            <IonCol size="auto">
                                <IonButton size="small" fill="clear" disabled={description.length == 0} onClick={() => addMessage()}>
                                    <IonIcon icon={arrowForwardSharp} />
                                </IonButton>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </IonCard>
            </IonHeader>
            <IonContent>
                {messages.map(m => <MessageCard key={m._id} username={m._identity.publicKey.slice(-8)} description={m.description} url={findUrl(m.description)} />)}
            </IonContent>
        </IonPage>
    );
};

export default MessagesPage;
