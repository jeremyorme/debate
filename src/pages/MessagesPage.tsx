import { IonBackButton, IonButton, IonButtons, IonCard, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, IonInput, IonPage, IonRow, IonTitle, IonToolbar } from "@ionic/react";
import { arrowForwardSharp, thumbsDownOutline, thumbsDownSharp, thumbsUpOutline, thumbsUpSharp } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { dbEntryDefaults } from "../app-data/IDbEntry";
import { IMessage } from "../app-data/IMessage";
import { VoteDirection, IVote } from "../app-data/IVote";
import { PageData } from "../app-data/PageData";
import MessageCard from "../components/MessageCard";
import OverflowMenu, { SortBy } from "../components/OverflowMenu";
import { findUrl } from "../Utils";
import './MessagesPage.css';

interface ContainerProps {
    pageData: PageData;
}

interface ContainerParams {
    id: string;
    side: string;
}

const PAGE_SIZE = 10;

const MessagesPage: React.FC<ContainerProps> = ({ pageData }) => {
    const { id, side } = useParams<ContainerParams>();
    const getDebateTitle = () => pageData.debates.entry(id)?.title || '<< Loading >>';
    const getDebateOwner = () => pageData.debates.entry(id)?._identity.publicKey || null;

    const [debateTitle, setDebateTitle] = useState(getDebateTitle());
    const [messages, setMessages] = useState(side == 'for' ? pageData.messagesFor.entries(id) : pageData.messagesAgainst.entries(id));
    const [description, setDescription] = useState('');
    const [ownVoteDirection, setOwnVoteDirection] = useState(pageData.ownVoteDirection(id));
    const [startCodeLoaded, setStartCodeLoaded] = useState(false);
    const [startCode, setStartCode] = useState(pageData.startCodes.entry(id));
    const [archivedDebateLoaded, setArchivedDebateLoaded] = useState(false);
    const [archivedDebate, setArchivedDebate] = useState(pageData.archivedDebates.entry(id));
    const [myLikedMessageIds, setMyLikedMessageIds] = useState([] as string[]);
    const [myLikedMessageIdxs, setMyLikedMessageIdxs] = useState(new Map<string, number>());
    const [likedMessageCounts, setLikedMessageCounts] = useState(new Map<string, number>());
    const [sortBy, setSortBy] = useState(SortBy.Time);
    const [renderedMessages, setRenderedMessages] = useState(messages.slice(0, PAGE_SIZE));
    const [maxRenderedMessages, setMaxRenderedMessages] = useState(PAGE_SIZE);

    useEffect(() => {
        return pageData.onInit(() => {
            pageData.debates.load();
            const messageLikes = side == 'for' ? pageData.messageForLikes : pageData.messageAgainstLikes;
            messageLikes.load(id);
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
            setMessages(side == 'for' ? archivedDebate.messagesFor : archivedDebate.messagesAgainst);
        }
        else if (startCode) {
            const messages = side == 'for' ? pageData.messagesFor : pageData.messagesAgainst;
            messages.load(id, startCode);

            pageData.votes.load(id, startCode);
        }
    }, [startCodeLoaded, archivedDebateLoaded]);

    useEffect(() => {
        const messages = side == 'for' ? pageData.messagesFor : pageData.messagesAgainst;
        return messages.onUpdated(id, () => {
            setMessages(messages.entries(id));
        });
    }, []);

    useEffect(() => {
        return pageData.votes.onUpdated(id, () => {
            setOwnVoteDirection(pageData.ownVoteDirection(id));
        });
    }, []);

    useEffect(() => {
        const messageLikes = side == 'for' ? pageData.messageForLikes : pageData.messageAgainstLikes;
        return messageLikes.onUpdated(id, () => {
            const allLikes = messageLikes.entries(id);
            const likeCounts = new Map<string, number>();
            for (const likes of allLikes)
                for (const id of likes.ids)
                    likeCounts.set(id, (likeCounts.get(id) || 0) + 1);
            setLikedMessageCounts(likeCounts);

            if (!pageData.selfPublicKey)
                return;

            const myLikedMessages = messageLikes.entry(id, pageData.selfPublicKey);
            if (!myLikedMessages)
                return;
            setMyLikedMessageIds(myLikedMessages.ids);

            const myLikedMessageIdxs = new Map<string, number>();
            myLikedMessages.ids.forEach((id, i) => myLikedMessageIdxs.set(id, i));
            setMyLikedMessageIdxs(myLikedMessageIdxs);
        });
    }, []);

    useEffect(() => {
        return () => {
            pageData.votes.close(id);
            pageData.messagesAgainst.close(id);
            pageData.messagesFor.close(id);
            pageData.startCodes.close(id);
            pageData.archivedDebates.close(id);
            const messageLikes = side == 'for' ? pageData.messageForLikes : pageData.messageAgainstLikes;
            messageLikes.close(id);
        };
    }, []);

    useEffect(() => {
        const byMostPopularFirst = (a: IMessage, b: IMessage) => {
            return messageLikeCount(b._id) - messageLikeCount(a._id);
        };
        setRenderedMessages(sortBy == SortBy.Time ?
            messages.slice(0, maxRenderedMessages) :
            [...messages].sort(byMostPopularFirst).slice(0, maxRenderedMessages));
    }, [sortBy, messages, maxRenderedMessages]);

    const updateDescription = (input: HTMLInputElement | null) => {
        if (!input || !input.value && input.value != '')
            return;

        setDescription(input.value);
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

    const toggleMessageLiked = (messageId: string) => {
        if (!pageData.selfPublicKey)
            return;

        let newIds = [...myLikedMessageIds];
        const idx = myLikedMessageIdxs.get(messageId);
        if (idx || idx == 0)
            newIds.splice(idx, 1);
        else
            newIds.push(messageId);
        const messageLikes = side == 'for' ? pageData.messageForLikes : pageData.messageAgainstLikes;
        messageLikes.addEntry(id, { ...dbEntryDefaults, _id: pageData.selfPublicKey, ids: newIds });
    }

    const isMessageLiked = (messageId: string) => {
        return !!myLikedMessageIdxs.has(messageId);
    }

    const messageLikeCount = (messageId: string) => {
        return likedMessageCounts.get(messageId) || 0;
    }

    const onInfiniteScroll = (ev: CustomEvent<void>) => {
        const target = ev.target as HTMLIonInfiniteScrollElement;
        setTimeout(() => target.complete(), 500);
        setMaxRenderedMessages(maxRenderedMessages + PAGE_SIZE);
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
                        {!archivedDebate && side == 'against' ? <IonButton slot="icon-only" onClick={() => updateOwnVoteDirection(VoteDirection.Against)}>
                            <IonIcon icon={ownVoteDirection == VoteDirection.Against ? thumbsDownSharp : thumbsDownOutline} />
                        </IonButton> : null}
                        {!archivedDebate && side == 'for' ? <IonButton slot="icon-only" onClick={() => updateOwnVoteDirection(VoteDirection.For)}>
                            <IonIcon icon={ownVoteDirection == VoteDirection.For ? thumbsUpSharp : thumbsUpOutline} />
                        </IonButton> : null}
                        <OverflowMenu id="messages" sortBy={sortBy} onSortByChanged={setSortBy} />
                    </IonButtons>
                </IonToolbar>
                {!archivedDebate ? <IonCard>
                    <IonGrid>
                        <IonRow>
                            <IonCol>
                                <IonInput placeholder="What do you think?" value={description} onIonInput={e => updateDescription(e.detail.target as HTMLInputElement)} />
                            </IonCol>
                            <IonCol size="auto">
                                <IonButton size="small" fill="clear" disabled={description.length == 0} onClick={() => addMessage()}>
                                    <IonIcon icon={arrowForwardSharp} />
                                </IonButton>
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                </IonCard> : null}
            </IonHeader>
            <IonContent>
                {renderedMessages.map(m => <MessageCard
                    key={m._id}
                    username={m._identity.publicKey.slice(-8)}
                    description={m.description}
                    url={findUrl(m.description)}
                    isLiked={isMessageLiked(m._id)}
                    onToggleLiked={() => toggleMessageLiked(m._id)}
                    likeCount={messageLikeCount(m._id)} />)}
                <IonInfiniteScroll disabled={renderedMessages.length == messages.length} onIonInfinite={onInfiniteScroll}>
                    <IonInfiniteScrollContent></IonInfiniteScrollContent>
                </IonInfiniteScroll>
            </IonContent>
        </IonPage>
    );
};

export default MessagesPage;
