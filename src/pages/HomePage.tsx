import { IonAvatar, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonItem, IonPage, IonSegment, IonSegmentButton, IonToolbar, useIonAlert } from '@ionic/react';
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

const HomePage: React.FC<ContainerProps> = ({ pageData }) => {
    const [presentAlert] = useIonAlert();
    const [isOpen, setIsOpen] = useState(false);
    const [debateStage, setDebateStage] = useState(DebateStage.Upcoming);
    const [allDebates, setAllDebates] = useState([] as ILimitedDebate[])
    const [filteredDebates, setFilteredDebates] = useState([] as ILimitedDebate[]);
    const [myLikedDebateIds, setMyLikedDebateIds] = useState([] as string[]);
    const [myLikedDebateIdxs, setMyLikedDebateIdxs] = useState(new Map<string, number>());
    const [likedDebateCounts, setLikedDebateCounts] = useState(new Map<string, number>());

    useEffect(() => {
        return pageData.onInit(() => {
            pageData.debates.load();
            pageData.debateLikes.load();
        });
    }, []);

    useEffect(() => {
        setFilteredDebates(debateStage == DebateStage.Upcoming ? allDebates.filter(d => !d.startCode) :
            debateStage == DebateStage.Active ? allDebates.filter(d => d.startCode && !d.archivedDebate) :
                debateStage == DebateStage.Ended ? allDebates.filter(d => d.archivedDebate) : []);
    }, [allDebates, debateStage]);

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

            await pageData.archivedDebates.addEntry(id, {
                ...dbEntryDefaults,
                messagesFor: pageData.messagesFor.entries(id),
                messagesAgainst: pageData.messagesAgainst.entries(id),
                presentations: pageData.presentations.entries(id),
                votesFor: pageData.votesFor(id),
                votesAgainst: pageData.votesAgainst(id)
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

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonItem>
                        <IonAvatar slot="start"><img src="https://ionicframework.com/docs/img/demos/avatar.svg" /></IonAvatar>
                        <IonIcon className="app-icon" icon={chatbubbles}></IonIcon>
                    </IonItem>
                    <IonSegment value={debateStage} onIonChange={e => updateDebateStage(e.detail.value)}>
                        {Object.keys(DebateStage).map(s => <IonSegmentButton key={s} value={s}>{s}</IonSegmentButton>)}
                    </IonSegment>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                {filteredDebates.map(d => <DebateCard
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
