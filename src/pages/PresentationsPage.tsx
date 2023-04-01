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
    const getDebateOwner = () => pageData.debates.entry(id)?._identity.publicKey || null;

    const [debateTitle, setDebateTitle] = useState(getDebateTitle());
    const [presentations, setPresentations] = useState(pageData.presentations.entries(id));
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [ownVoteDirection, setOwnVoteDirection] = useState(pageData.ownVoteDirection(id));
    const [startCodeLoaded, setStartCodeLoaded] = useState(false);
    const [startCode, setStartCode] = useState(pageData.startCodes.entry(id));
    const [archivedDebateLoaded, setArchivedDebateLoaded] = useState(false);
    const [archivedDebate, setArchivedDebate] = useState(pageData.archivedDebates.entry(id));

    useEffect(() => {
        return pageData.onInit(() => {
            pageData.debates.load();
        });
    }, []);

    useEffect(() => {
        return pageData.debates.onUpdated(() => {
            setDebateTitle(getDebateTitle());

            const owner = getDebateOwner();
            pageData.archivedDebates.load(id, null, owner);
            pageData.startCodes.load(id, null, owner);
        });
    }, []);

    useEffect(() => {
        return () => {
            pageData.votes.close(id);
            pageData.presentations.close(id);
            pageData.startCodes.close(id);
            pageData.archivedDebates.close(id);
        };
    }, []);

    useEffect(() => {
        return pageData.archivedDebates.onUpdated(id, () => {
            setArchivedDebateLoaded(true);

            const archivedDebate = pageData.archivedDebates.entry(id);
            setArchivedDebate(archivedDebate);
        });
    }, []);

    useEffect(() => {
        return pageData.startCodes.onUpdated(id, () => {
            setStartCodeLoaded(true);

            const startCode = pageData.startCodes.entry(id);
            setStartCode(startCode);
        });
    }, []);

    useEffect(() => {
        if (!startCodeLoaded || !archivedDebateLoaded)
            return;
        if (archivedDebate) {
            setPresentations(archivedDebate.presentations);
        }
        else if (startCode) {
            pageData.presentations.load(id, startCode);
            pageData.votes.load(id, startCode);
        }
    }, [startCodeLoaded, archivedDebateLoaded]);

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
            pageData.startCodes.close(id);
            pageData.archivedDebates.close(id);
        };
    }, []);

    const updateTitle = (input: HTMLInputElement | null) => {
        if (!input || !input.value && input.value != '')
            return;

        setTitle(input.value);
    };

    const updateUrl = (input: HTMLInputElement | null) => {
        if (!input || !input.value && input.value != '')
            return;

        setUrl(input.value);
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
                    {!archivedDebate ? <IonButtons slot="end">
                        <IonButton slot="icon-only" onClick={() => updateOwnVoteDirection(VoteDirection.For)}>
                            <IonIcon icon={ownVoteDirection == VoteDirection.For ? thumbsUpSharp : thumbsUpOutline} />
                        </IonButton>
                        <IonButton slot="icon-only" onClick={() => updateOwnVoteDirection(VoteDirection.Against)}>
                            <IonIcon icon={ownVoteDirection == VoteDirection.Against ? thumbsDownSharp : thumbsDownOutline} />
                        </IonButton>
                    </IonButtons> : null}
                </IonToolbar>
                {!archivedDebate ? <IonCard>
                    <IonGrid>
                        <IonRow>
                            <IonCol>
                                <IonInput placeholder="Title" value={title} onIonInput={e => updateTitle(e.detail.target as HTMLInputElement)} />
                            </IonCol>
                        </IonRow>
                        <IonRow>
                            <IonCol>
                                <IonInput placeholder="URL" value={url} onIonInput={e => updateUrl(e.detail.target as HTMLInputElement)} />
                            </IonCol>
                            <IonCol size="auto">
                                <IonButton size="small" fill="clear" disabled={url.length == 0} onClick={() => addPresentation()}>
                                    <IonIcon icon={addSharp} />
                                </IonButton>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </IonCard> : null}
            </IonHeader>
            <IonContent>
                {presentations.filter(p => p.url).map(p => <MessageCard key={p._id} username={p._identity.publicKey.slice(-8)} title={p.title} description="" url={p.url} />)}
            </IonContent>
        </IonPage>
    );
};

export default PresentationsPage;
