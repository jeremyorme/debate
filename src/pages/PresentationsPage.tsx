import { IonBackButton, IonButton, IonButtons, IonCard, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonPage, IonRow, IonTitle, IonToolbar } from "@ionic/react";
import { addSharp, thumbsDownOutline, thumbsDownSharp, thumbsUpOutline, thumbsUpSharp } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { dbEntryDefaults } from "../app-data/IDbEntry";
import { IPresentation } from "../app-data/IPresentation";
import { VoteDirection, IVote } from "../app-data/IVote";
import { PageData } from "../app-data/PageData";
import MessageCard from "../components/MessageCard";
import "./PresentationsPage.css";

interface ContainerProps {
    pageData: PageData;
}

interface ContainerParams {
    id: string;
}

const PresentationsPage: React.FC<ContainerProps> = ({ pageData }) => {
    const { id } = useParams<ContainerParams>();
    const getDebateTitle = () => pageData.debates.entry(id)?.title || '<< Loading >>';

    const [debateTitle, setDebateTitle] = useState(getDebateTitle());
    const [presentations, setPresentations] = useState(pageData.presentations.entries(id));
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [ownVoteDirection, setOwnVoteDirection] = useState(pageData.ownVoteDirection(id));

    useEffect(() => {
        return pageData.onInit(() => {
            pageData.debates.load();
        });
    }, []);

    useEffect(() => {
        return pageData.debates.onUpdated(() => {
            setDebateTitle(getDebateTitle());
            pageData.presentations.load(id);
            pageData.votes.load(id);
        });
    }, []);

    useEffect(() => {
        return pageData.presentations.onUpdated(id, () => {
            setPresentations(pageData.presentations.entries(id));
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
            pageData.presentations.close(id);
        };
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
        pageData.presentations.addEntry(id, presentation);
        setTitle('');
        setUrl('');
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
