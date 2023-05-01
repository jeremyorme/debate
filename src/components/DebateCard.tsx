import { IonAvatar, IonBadge, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonItem, IonLabel, IonToolbar } from '@ionic/react';
import './DebateCard.css';
import ReactPlayer from 'react-player';
import { heartSharp, peopleSharp, playCircleSharp, stopCircleSharp, thumbsDownSharp, thumbsUpSharp, videocamSharp } from 'ionicons/icons';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';
import { findUrl } from '../Utils';
import { PageData } from '../app-data/PageData';
import { IArchivedDebate } from '../app-data/IArchivedDebate';
import { IStartCode } from '../app-data/IStartCode';
import { countFormat } from '../util/CountFormat';

export enum DebateStage {
    Upcoming = 'Upcoming',
    Active = 'Active',
    Ended = 'Ended'
}

interface ContainerProps {
    pageData: PageData,
    id: string;
    debateStage: DebateStage;
    startCode: IStartCode | null;
    archivedDebate: IArchivedDebate | null;
    onTransition: () => void;
    isLiked: boolean;
    onToggleLiked: () => void;
    likeCount: number;
}

const DebateCard: React.FC<ContainerProps> = ({
    pageData, id, debateStage, startCode, archivedDebate, onTransition, isLiked, onToggleLiked, likeCount }) => {
    const [debate] = useState(pageData.debates.entry(id));
    const { ref, inView } = useInView();
    const [voteTotals, setVoteTotals] = useState(pageData.voteTotals(id));

    useEffect(() => {
        if (inView) {
            if (archivedDebate) {
                setVoteTotals({
                    votesFor: archivedDebate.votesFor,
                    votesAgainst: archivedDebate.votesAgainst
                });
            }
            else if (startCode) {
                pageData.votes.load(id, startCode);
            }
        }
        else {
            pageData.votes.close(id);
        }
    }, [inView]);

    useEffect(() => {
        if (inView)
            return pageData.votes.onUpdated(id, () => {
                setVoteTotals(pageData.voteTotals(id));
            });
    }, [inView]);

    if (!debate)
        return null;

    const url = findUrl(debate.description);

    return (
        <IonCard ref={ref}>
            <IonCardHeader>
                <IonItem className="head-item" lines="none">
                    <IonAvatar slot="start"><img src="https://ionicframework.com/docs/img/demos/avatar.svg" /></IonAvatar>
                    <IonLabel color="medium"><strong>@{debate._identity.publicKey.slice(-8)}</strong> - Just now</IonLabel>
                    {debateStage != DebateStage.Ended && pageData.selfPublicKey == debate._identity.publicKey ? <IonButton slot="end" className="transition-button" onClick={() => onTransition()}>
                        <IonIcon icon={debateStage == DebateStage.Upcoming ? playCircleSharp : stopCircleSharp}></IonIcon>
                    </IonButton> : null}
                </IonItem>
                <IonCardTitle>{debate.title}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
                <p>{debate.description}</p>
            </IonCardContent>
            {url && ReactPlayer.canPlay(url) ? <div className="player-para">
                <div className='player-wrapper'>
                    <ReactPlayer className='react-player' url={url} width='100%' height='100%' />
                </div>
            </div> : null}
            <IonToolbar>
                <IonItem className="counts">
                    {debateStage != DebateStage.Upcoming ? <IonItem>
                        <Link to={'/debate/' + id + '/messages/for'}>
                            <IonIcon size="small" icon={thumbsUpSharp} />
                        </Link>
                        <IonBadge className="count">{countFormat(voteTotals.votesFor)}</IonBadge>
                    </IonItem> : null}
                    {debateStage != DebateStage.Upcoming ? <IonItem>
                        <Link to={'/debate/' + id + '/messages/against'}>
                            <IonIcon size="small" icon={thumbsDownSharp} />
                        </Link>
                        <IonBadge className="count">{countFormat(voteTotals.votesAgainst)}</IonBadge>
                    </IonItem> : null}
                    {debateStage != DebateStage.Upcoming ? <IonItem>
                        <Link to={'/debate/' + id + '/presentations'}>
                            <IonIcon size="small" icon={videocamSharp} />
                        </Link>
                        <IonBadge className="count">11</IonBadge>
                    </IonItem> : null}
                    <IonItem>
                        <IonIcon size="small" icon={heartSharp} color={isLiked ? 'danger' : 'medium'} onClick={() => onToggleLiked()} />
                        <IonBadge className="count">{likeCount}</IonBadge>
                    </IonItem>
                    <IonItem>
                        <IonIcon size="small" icon={peopleSharp} />
                        <IonBadge className="count">1</IonBadge>
                    </IonItem>
                </IonItem>
            </IonToolbar>
        </IonCard>
    );
};

export default DebateCard;