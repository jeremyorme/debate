import { IonBackButton, IonButton, IonButtons, IonCard, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonPage, IonRow, IonTitle, IonToolbar } from "@ionic/react";
import { addSharp, arrowForwardSharp, thumbsDownOutline, thumbsDownSharp, thumbsUpOutline, thumbsUpSharp } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppData, dbEntryDefaults, IPresentation, IVote, VoteDirection } from "../AppData";
import MessageCard from "../components/MessageCard";
import "./PresentationsPage.css";

interface ContainerProps {
    appData: AppData;
}

interface ContainerParams {
    id: string;
}

const PAGE_ID = 'presentations-page';

const PresentationsPage: React.FC<ContainerProps> = ({ appData }) => {
    const { id } = useParams<ContainerParams>();
    const [debateTitle, setDebateTitle] = useState(appData.debateTitle(id));
    const [presentations, setPresentations] = useState(appData.presentations());
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [ownVoteDirection, setOwnVoteDirection] = useState(appData.ownVoteDirection(id, PAGE_ID));

    useEffect(() => {
        appData.loadPresentations(id);
        appData.loadVotes(id, PAGE_ID);
        return appData.onDebatesUpdated(() => {
            setDebateTitle(appData.debateTitle(id));
            appData.loadPresentations(id);
            appData.loadVotes(id, PAGE_ID);
        });
    }, []);

    useEffect(() => {
        return appData.onPresentations(() => {
            setPresentations(appData.presentations());
        });
    }, []);

    useEffect(() => {
        return appData.onVotes(id, PAGE_ID, () => {
            setOwnVoteDirection(appData.ownVoteDirection(id, PAGE_ID));
        });
    }, []);

    const updateTitle = (value: string | null | undefined) => {
        if (!value && value != '')
            return;

        setTitle(value);
    };

    const updateUrl = (value: string | null | undefined) => {
        if (!value && value != '')
            return;

        setUrl(value);
    };

    const addPresentation = () => {
        const presentation: IPresentation = {
            ...dbEntryDefaults,
            title,
            url
        };
        appData.addPresentation(presentation);
        setTitle('');
        setUrl('');
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
                    <IonTitle>{debateTitle}</IonTitle>
                    <IonButtons slot="end">
                        <IonButton slot="icon-only" onClick={() => updateOwnVoteDirection(VoteDirection.For)}>
                            <IonIcon icon={ownVoteDirection == VoteDirection.For ? thumbsUpSharp : thumbsUpOutline} />
                        </IonButton>
                        <IonButton slot="icon-only" onClick={() => updateOwnVoteDirection(VoteDirection.Against)}>
                            <IonIcon icon={ownVoteDirection == VoteDirection.Against ? thumbsDownSharp : thumbsDownOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
                <IonCard>
                    <IonGrid>
                        <IonRow>
                            <IonCol>
                                <IonInput placeholder="Title" value={title} onIonChange={e => updateTitle(e.detail.value)} />
                            </IonCol>
                        </IonRow>
                        <IonRow>
                            <IonCol>
                                <IonInput placeholder="URL" value={url} onIonChange={e => updateUrl(e.detail.value)} />
                            </IonCol>
                            <IonCol size="auto">
                                <IonButton size="small" fill="clear" disabled={url.length == 0} onClick={() => addPresentation()}>
                                    <IonIcon icon={addSharp} />
                                </IonButton>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </IonCard>
            </IonHeader>
            <IonContent>
                {presentations.filter(p => p.url).map(p => <MessageCard key={p._id} username={p._identity.publicKey.slice(-8)} title={p.title} description="" url={p.url} />)}
            </IonContent>
        </IonPage>
    );
};

export default PresentationsPage;
