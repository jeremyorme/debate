import { IonAvatar, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonItem, IonPage, IonSegment, IonSegmentButton, IonToolbar, useIonAlert } from '@ionic/react';
import { add, chatbubbles } from 'ionicons/icons';
import DebateAddModal from '../components/DebateAddModal';
import DebateCard, { DebateStage } from '../components/DebateCard';
import { useEffect, useState } from 'react';
import './HomePage.css';
import { PageData } from '../app-data/PageData';
import { IArchivedDebate } from '../app-data/IArchivedDebate';
import { dbEntryDefaults } from '../app-data/IDbEntry';
import { IDebate } from '../app-data/IDebate';
import { IStartCode } from '../app-data/IStartCode';
import OverflowMenu, { SortBy } from '../components/OverflowMenu';

interface ContainerProps {
    pageData: PageData;
}

interface ILimitedDebate {
    debate: IDebate;
    startCode: IStartCode | null;
    archivedDebate: IArchivedDebate | null;
}

function uuidv4() {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
}

const PAGE_SIZE = 10;

const HomePage: React.FC<ContainerProps> = ({ pageData }) => {
    const [presentAlert] = useIonAlert();
    const [isOpen, setIsOpen] = useState(false);
    const [debateStage, setDebateStage] = useState(DebateStage.Upcoming);
    const [allDebates, setAllDebates] = useState([] as ILimitedDebate[])
    const [filteredDebates, setFilteredDebates] = useState([] as ILimitedDebate[]);
    const [myLikedDebateIds, setMyLikedDebateIds] = useState([] as string[]);
    const [myLikedDebateIdxs, setMyLikedDebateIdxs] = useState(new Map<string, number>());
    const [likedDebateCounts, setLikedDebateCounts] = useState(new Map<string, number>());
    const [sortBy, setSortBy] = useState(SortBy.Time);
    const [renderedDebates, setRenderedDebates] = useState([] as ILimitedDebate[]);
    const [maxRenderedDebates, setMaxRenderedDebates] = useState(PAGE_SIZE);

    useEffect(() => {
        return pageData.onInit(() => {
            pageData.debates.load();
            pageData.debateLikes.load();
        });
    }, []);

    useEffect(() => {
        const byMostPopularFirst = (a: ILimitedDebate, b: ILimitedDebate) => {
            return debateLikeCount(b.debate._id) - debateLikeCount(a.debate._id);
        };
        const sortedDebates = sortBy == SortBy.Time ? allDebates : [...allDebates].sort(byMostPopularFirst);
        const filteredDebates = debateStage == DebateStage.Upcoming ? sortedDebates.filter(d => !d.startCode) :
            debateStage == DebateStage.Active ? sortedDebates.filter(d => d.startCode && !d.archivedDebate) :
                debateStage == DebateStage.Ended ? sortedDebates.filter(d => d.archivedDebate) : [];
        setFilteredDebates(filteredDebates);
        setRenderedDebates(filteredDebates.slice(0, maxRenderedDebates));
    }, [allDebates, debateStage, sortBy, maxRenderedDebates]);

    const loadDebates = async () => {
        setAllDebates(await Promise.all(pageData.debates.entries().map(async (debate: IDebate) => {
            await pageData.startCodes.load(debate._id, null, debate._identity.publicKey);
            const startCode = pageData.startCodes.entry(debate._id);
            pageData.startCodes.close(debate._id);
            await pageData.archivedDebates.load(debate._id, null, debate._identity.publicKey);
            const archivedDebate = pageData.archivedDebates.entry(debate._id);
            pageData.archivedDebates.close(debate._id);
            return ({ debate, startCode, archivedDebate }) as ILimitedDebate;
        })));
    };

    useEffect(() => {
        return pageData.debates.onUpdated(loadDebates);
    }, []);

    useEffect(() => {
        return pageData.debateLikes.onUpdated(() => {
            const allLikes = pageData.debateLikes.entries();
            const likeCounts = new Map<string, number>();
            for (const likes of allLikes)
                for (const id of likes.ids)
                    likeCounts.set(id, (likeCounts.get(id) || 0) + 1);
            setLikedDebateCounts(likeCounts);

            if (!pageData.selfPublicKey)
                return;

            const myLikedDebates = pageData.debateLikes.entry(pageData.selfPublicKey);
            if (!myLikedDebates)
                return;
            setMyLikedDebateIds(myLikedDebates.ids);

            const myLikedDebateIdxs = new Map<string, number>();
            myLikedDebates.ids.forEach((id, i) => myLikedDebateIdxs.set(id, i));
            setMyLikedDebateIdxs(myLikedDebateIdxs);
        });
    }, []);

    const updateDebateStage = (value: string | null | undefined) => {
        if (!value && value != '')
            return;

        const debateStage: DebateStage = (DebateStage as any)[value];
        setDebateStage(debateStage);
        setMaxRenderedDebates(PAGE_SIZE);
    };

    const transitionDebate = async (d: ILimitedDebate) => {
        const id = d.debate._id;

        if (!d.startCode) {
            await pageData.startCodes.load(id, null, d.debate._identity.publicKey);
            await pageData.startCodes.addEntry(id, {
                ...dbEntryDefaults,
                value: uuidv4()
            });
            pageData.startCodes.close(id);
        }
        else {
            await Promise.all([
                pageData.messagesFor.load(id, d.startCode),
                pageData.messagesAgainst.load(id, d.startCode),
                pageData.presentations.load(id, d.startCode),
                pageData.votes.load(id, d.startCode),
                pageData.archivedDebates.load(id, null, d.debate._identity.publicKey)]);

            const voteTotals = pageData.voteTotals(id);
            await pageData.archivedDebates.addEntry(id, {
                ...dbEntryDefaults,
                messagesFor: pageData.messagesFor.entries(id),
                messagesAgainst: pageData.messagesAgainst.entries(id),
                presentations: pageData.presentations.entries(id),
                votesFor: voteTotals.votesFor,
                votesAgainst: voteTotals.votesAgainst
            });

            // Update user voting history for each voter
            pageData.votes.entries(id).map(async v => {
                const voterId = v._identity.publicKey;
                await pageData.archivedVotes.load(voterId);
                const groupName = d.debate.groups[v.groupIdx].name;
                pageData.archivedVotes.addEntry(voterId, { ...v, _id: id, groupName });
                pageData.archivedVotes.close(voterId);
            });

            pageData.archivedDebates.close(id);
            pageData.votes.close(id);
            pageData.presentations.close(id);
            pageData.messagesAgainst.close(id);
            pageData.messagesFor.close(id);
        }

        loadDebates();
    };

    const askTransitionDebate = (d: ILimitedDebate) => {
        presentAlert({
            header: `${debateStage == DebateStage.Upcoming ? 'Start' : 'End'} Debate`,
            subHeader: 'Are you sure?',
            message: "This action can't be undone!",
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                },
                {
                    text: 'OK',
                    role: 'confirm',
                    handler: () => transitionDebate(d),
                },
            ],
        });
    };

    const toggleDebateLiked = (debateId: string) => {
        if (!pageData.selfPublicKey)
            return;

        let newIds = [...myLikedDebateIds];
        const idx = myLikedDebateIdxs.get(debateId);
        if (idx || idx == 0)
            newIds.splice(idx, 1);
        else
            newIds.push(debateId);
        pageData.debateLikes.addEntry({ ...dbEntryDefaults, _id: pageData.selfPublicKey, ids: newIds });
    }

    const isDebateLiked = (debateId: string) => {
        return !!myLikedDebateIdxs.has(debateId);
    }

    const debateLikeCount = (debateId: string) => {
        return likedDebateCounts.get(debateId) || 0;
    }

    const onInfiniteScroll = (ev: CustomEvent<void>) => {
        const target = ev.target as HTMLIonInfiniteScrollElement;
        setTimeout(() => target.complete(), 500);
        setMaxRenderedDebates(maxRenderedDebates + PAGE_SIZE);
    }

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonItem>
                        <IonAvatar slot="start"><img src="https://ionicframework.com/docs/img/demos/avatar.svg" /></IonAvatar>
                        <IonIcon className="app-icon" icon={chatbubbles}></IonIcon>
                        <IonButtons slot="end">
                            <OverflowMenu id="debates" sortBy={sortBy} onSortByChanged={setSortBy} />
                        </IonButtons>
                    </IonItem>
                    <IonSegment value={debateStage} onIonChange={e => updateDebateStage(e.detail.value)}>
                        {Object.keys(DebateStage).map(s => <IonSegmentButton key={s} value={s}>{s}</IonSegmentButton>)}
                    </IonSegment>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                {renderedDebates.map(d => <DebateCard
                    key={d.debate._id}
                    pageData={pageData}
                    id={d.debate._id}
                    debateStage={debateStage}
                    startCode={d.startCode}
                    archivedDebate={d.archivedDebate}
                    onTransition={() => askTransitionDebate(d)}
                    isLiked={isDebateLiked(d.debate._id)}
                    onToggleLiked={() => { toggleDebateLiked(d.debate._id) }}
                    likeCount={debateLikeCount(d.debate._id)} />)}
                <IonInfiniteScroll disabled={renderedDebates.length == filteredDebates.length} onIonInfinite={onInfiniteScroll}>
                    <IonInfiniteScrollContent></IonInfiniteScrollContent>
                </IonInfiniteScroll>
            </IonContent>
            {debateStage == DebateStage.Upcoming ? <IonFab slot="fixed" vertical="bottom" horizontal="end">
                <IonFabButton onClick={() => setIsOpen(true)}>
                    <IonIcon icon={add} />
                </IonFabButton>
            </IonFab> : null}
            <DebateAddModal pageData={pageData} isOpen={isOpen} setIsOpen={setIsOpen} />
        </IonPage>
    );
};

export default HomePage;
