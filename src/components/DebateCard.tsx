import { IonAvatar, IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonItem, IonLabel, IonToolbar } from '@ionic/react';
import './DebateCard.css';
import ReactPlayer from 'react-player';
import { heartSharp, peopleSharp, thumbsDownSharp, thumbsUpSharp, videocamSharp } from 'ionicons/icons';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';
import { PageData } from '../AppData';
import { findUrl } from '../Utils';

interface ContainerProps {
    pageData: PageData,
    id: string;
}

const DebateCard: React.FC<ContainerProps> = ({ pageData, id }) => {
    const [debate] = useState(pageData.debates.entry(id));
    const { ref, inView } = useInView();
    const [votesFor, setVotesFor] = useState(pageData.votesFor(id));
    const [votesAgainst, setVotesAgainst] = useState(pageData.votesAgainst(id));

    useEffect(() => {
        if (inView)
            pageData.votes.load(id);
        else
            pageData.votes.close(id);
    }, [inView]);

    useEffect(() => {
        if (inView)
            return pageData.votes.onUpdated(id, () => {
                setVotesFor(pageData.votesFor(id));
                setVotesAgainst(pageData.votesAgainst(id));
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
                    <IonItem>
                        <Link to={'/debate/' + id + '/messages/for'}>
                            <IonIcon size="small" icon={thumbsUpSharp} />
                        </Link>
                        <IonBadge className="count">{votesFor}</IonBadge>
                    </IonItem>
                    <IonItem>
                        <Link to={'/debate/' + id + '/messages/against'}>
                            <IonIcon size="small" icon={thumbsDownSharp} />
                        </Link>
                        <IonBadge className="count">{votesAgainst}</IonBadge>
                    </IonItem>
                    <IonItem>
                        <Link to={'/debate/' + id + '/presentations'}>
                            <IonIcon size="small" icon={videocamSharp} />
                        </Link>
                        <IonBadge className="count">11</IonBadge>
                    </IonItem>
                    <IonItem>
                        <IonIcon size="small" icon={heartSharp} />
                        <IonBadge className="count">11</IonBadge>
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