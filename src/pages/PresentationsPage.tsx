import { IonBackButton, IonButton, IonButtons, IonCard, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonInput, IonPage, IonRow, IonTitle, IonToolbar } from "@ionic/react";
import { addSharp, thumbsDownOutline, thumbsDownSharp, thumbsUpOutline, thumbsUpSharp } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { dbEntryDefaults } from "../app-data/IDbEntry";
import { IPresentation } from "../app-data/IPresentation";
import { VoteDirection, IVote } from "../app-data/IVote";
import { PageData } from "../app-data/PageData";
import MessageCard from "../components/MessageCard";
import OverflowMenu, { SortBy } from "../components/OverflowMenu";
import "./PresentationsPage.css";
import ItemsPopover from "../components/ItemsPopover";

interface ContainerProps {
    pageData: PageData;
}

interface ContainerParams {
    id: string;
}

const PAGE_SIZE = 10;

const PresentationsPage: React.FC<ContainerProps> = ({ pageData }) => {
    const { id } = useParams<ContainerParams>();
    const getDebateTitle = () => pageData.debates.entry(id)?.title || '<< Loading >>';
    const getDebateOwner = () => pageData.debates.entry(id)?._identity.publicKey || null;

    const [debateTitle, setDebateTitle] = useState(getDebateTitle());
    const [presentations, setPresentations] = useState(pageData.presentations.entries(id));
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [ownVoteDirection, setOwnVoteDirection] = useState(pageData.ownVoteDirection(id));
    const [ownVoteGroupIdx, setOwnVoteGroupIdx] = useState(pageData.ownVoteGroupIdx(id));
    const [startCodeLoaded, setStartCodeLoaded] = useState(false);
    const [startCode, setStartCode] = useState(pageData.startCodes.entry(id));
    const [archivedDebateLoaded, setArchivedDebateLoaded] = useState(false);
    const [archivedDebate, setArchivedDebate] = useState(pageData.archivedDebates.entry(id));
    const [myLikedPresentationIds, setMyLikedPresentationIds] = useState([] as string[]);
    const [myLikedPresentationIdxs, setMyLikedPresentationIdxs] = useState(new Map<string, number>());
    const [likedPresentationCounts, setLikedPresentationCounts] = useState(new Map<string, number>());
    const [sortBy, setSortBy] = useState(SortBy.Time);
    const [renderedPresentations, setRenderedPresentations] = useState(presentations.slice(0, PAGE_SIZE));
    const [maxRenderedPresentations, setMaxRenderedPresentations] = useState(PAGE_SIZE);

    useEffect(() => {
        return pageData.onInit(() => {
            pageData.debates.load();
            pageData.presentationLikes.load(id);
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
            setOwnVoteGroupIdx(pageData.ownVoteGroupIdx(id));
        });
    }, []);

    useEffect(() => {
        return pageData.presentationLikes.onUpdated(id, () => {
            const allLikes = pageData.presentationLikes.entries(id);
            const likeCounts = new Map<string, number>();
            for (const likes of allLikes)
                for (const id of likes.ids)
                    likeCounts.set(id, (likeCounts.get(id) || 0) + 1);
            setLikedPresentationCounts(likeCounts);

            if (!pageData.selfPublicKey)
                return;

            const myLikedPresentations = pageData.presentationLikes.entry(id, pageData.selfPublicKey);
            if (!myLikedPresentations)
                return;
            setMyLikedPresentationIds(myLikedPresentations.ids);

            const myLikedPresentationIdxs = new Map<string, number>();
            myLikedPresentations.ids.forEach((id, i) => myLikedPresentationIdxs.set(id, i));
            setMyLikedPresentationIdxs(myLikedPresentationIdxs);
        });
    }, []);

    useEffect(() => {
        return () => {
            pageData.votes.close(id);
            pageData.presentations.close(id);
            pageData.startCodes.close(id);
            pageData.archivedDebates.close(id);
            pageData.presentationLikes.close(id);
        };
    }, []);

    useEffect(() => {
        const byMostPopularFirst = (a: IPresentation, b: IPresentation) => {
            return presentationLikeCount(b._id) - presentationLikeCount(a._id);
        };
        setRenderedPresentations(sortBy == SortBy.Time ?
            presentations.slice(0, maxRenderedPresentations) :
            [...presentations].sort(byMostPopularFirst).slice(0, maxRenderedPresentations));
    }, [sortBy, presentations, maxRenderedPresentations]);

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

    const updateOwnVote = (newDirection: VoteDirection, groupIdx: number) => {
        const direction = groupIdx != -1 ? newDirection : VoteDirection.Undecided;
        const vote: IVote = {
            ...dbEntryDefaults,
            direction,
            groupIdx
        };
        pageData.votes.addEntry(id, vote);
        setOwnVoteDirection(direction);
        setOwnVoteGroupIdx(groupIdx);
    };

    const togglePresentationLiked = (presentationId: string) => {
        if (!pageData.selfPublicKey)
            return;

        let newIds = [...myLikedPresentationIds];
        const idx = myLikedPresentationIdxs.get(presentationId);
        if (idx || idx == 0)
            newIds.splice(idx, 1);
        else
            newIds.push(presentationId);
        pageData.presentationLikes.addEntry(id, { ...dbEntryDefaults, _id: pageData.selfPublicKey, ids: newIds });
    }

    const isPresentationLiked = (presentationId: string) => {
        return !!myLikedPresentationIdxs.has(presentationId);
    }

    const presentationLikeCount = (presentationId: string) => {
        return likedPresentationCounts.get(presentationId) || 0;
    }

    const onInfiniteScroll = (ev: CustomEvent<void>) => {
        const target = ev.target as HTMLIonInfiniteScrollElement;
        setTimeout(() => target.complete(), 500);
        setMaxRenderedPresentations(maxRenderedPresentations + PAGE_SIZE);
    }

    const groupItems: string[] = pageData.debateGroups(id).map(g => `${g.name} (${g.percent.toFixed(1)}%)`)

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/home" />
                    </IonButtons>
                    <IonTitle>{debateTitle}</IonTitle>
                    <IonButtons slot="end">
                        {!archivedDebate ? <div>
                            <IonButton slot="icon-only" id="presentations-vote-against">
                                <IonIcon icon={ownVoteDirection == VoteDirection.Against ? thumbsDownSharp : thumbsDownOutline} />
                            </IonButton>
                            <ItemsPopover
                                trigger="presentations-vote-against"
                                title="Select voting group:"
                                items={groupItems}
                                idx={ownVoteDirection == VoteDirection.Against ? ownVoteGroupIdx : -1}
                                onChange={i => updateOwnVote(VoteDirection.Against, i)} />
                            <IonButton slot="icon-only" id="presentations-vote-for">
                                <IonIcon icon={ownVoteDirection == VoteDirection.For ? thumbsUpSharp : thumbsUpOutline} />
                            </IonButton>
                            <ItemsPopover
                                trigger="presentations-vote-for"
                                title="Select voting group:"
                                items={groupItems}
                                idx={ownVoteDirection == VoteDirection.For ? ownVoteGroupIdx : -1}
                                onChange={i => updateOwnVote(VoteDirection.For, i)} />
                        </div> : null}
                        <OverflowMenu id="presentations" sortBy={sortBy} onSortByChanged={setSortBy} />
                    </IonButtons>
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
                {renderedPresentations.filter(p => p.url).map(p => <MessageCard
                    key={p._id}
                    username={p._identity.publicKey.slice(-8)}
                    title={p.title}
                    description=""
                    url={p.url}
                    isLiked={isPresentationLiked(p._id)}
                    onToggleLiked={() => togglePresentationLiked(p._id)}
                    likeCount={presentationLikeCount(p._id)} />)}
                <IonInfiniteScroll disabled={renderedPresentations.length == presentations.length} onIonInfinite={onInfiniteScroll}>
                    <IonInfiniteScrollContent></IonInfiniteScrollContent>
                </IonInfiniteScroll>
            </IonContent>
        </IonPage>
    );
};

export default PresentationsPage;
