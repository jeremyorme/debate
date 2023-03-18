import { IonBackButton, IonButton, IonButtons, IonCard, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonPage, IonRow, IonTitle, IonToolbar } from "@ionic/react";
import { arrowForwardSharp, thumbsDownOutline, thumbsDownSharp, thumbsUpOutline, thumbsUpSharp } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { dbEntryDefaults } from "../app-data/IDbEntry";
import { IMessage } from "../app-data/IMessage";
import { VoteDirection, IVote } from "../app-data/IVote";
import { PageData } from "../app-data/PageData";
import MessageCard from "../components/MessageCard";
import { findUrl } from "../Utils";
import './MessagesPage.css';

interface ContainerProps {
    pageData: PageData;
}

interface ContainerParams {
    id: string;
    side: string;
}

const MessagesPage: React.FC<ContainerProps> = ({ pageData }) => {
    const { id, side } = useParams<ContainerParams>();
    const getDebateTitle = () => pageData.debates.entry(id)?.title || '<< Loading >>';

    const [debateTitle, setDebateTitle] = useState(getDebateTitle());
    const [messages, setMessages] = useState(side == 'for' ? pageData.messagesFor.entries(id) : pageData.messagesAgainst.entries(id));
    const [description, setDescription] = useState('');
    const [ownVoteDirection, setOwnVoteDirection] = useState(pageData.ownVoteDirection(id));

    useEffect(() => {
        return pageData.onInit(() => {
            pageData.debates.load();
        });
    }, []);

    useEffect(() => {
        return pageData.debates.onUpdated(() => {
            setDebateTitle(getDebateTitle());
            if (side == 'for')
                pageData.messagesFor.load(id);
            else
                pageData.messagesAgainst.load(id);
            pageData.votes.load(id);
        });
    }, []);

    useEffect(() => {
        return side == 'for' ? pageData.messagesFor.onUpdated(id, () => {
            setMessages(pageData.messagesFor.entries(id));
        }) : pageData.messagesAgainst.onUpdated(id, () => {
            setMessages(pageData.messagesAgainst.entries(id));
        });
    }, []);

    useEffect(() => {
        return pageData.votes.onUpdated(id, () => {
            setOwnVoteDirection(pageData.ownVoteDirection(id));
        });
    }, []);

    useEffect(() => {
        return () => {
            pageData.votes.close(id);
            pageData.messagesAgainst.close(id);
            pageData.messagesFor.close(id);
        };
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
        if (side == 'for')
            pageData.messagesFor.addEntry(id, message);
        else
            pageData.messagesAgainst.addEntry(id, message);
        setDescription('');
    };

    const updateOwnVoteDirection = (newDirection: VoteDirection) => {
        const direction = newDirection != ownVoteDirection ? newDirection : VoteDirection.Undecided;
        const vote: IVote = {
            ...dbEntryDefaults,
            direction
        };
        pageData.votes.addEntry(id, vote);
        setOwnVoteDirection(direction);
    };

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
