import { IonAvatar, IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonItem, IonLabel, IonToolbar } from '@ionic/react';
import './DebateCard.css';
import ReactPlayer from 'react-player';
import { heartSharp, peopleSharp, thumbsDownSharp, thumbsUpSharp, videocamSharp } from 'ionicons/icons';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';
import { AppData } from '../AppData';

interface ContainerProps {
    appData: AppData,
    id: string;
    title: string;
    description: string;
    username: string;
    url: string;
}

const PAGE_ID = 'debate-card';

const DebateCard: React.FC<ContainerProps> = ({ appData, id, title, description, username, url }) => {
    const { ref, inView } = useInView();
    const [votesFor, setVotesFor] = useState(appData.votesFor(id, PAGE_ID));
    const [votesAgainst, setVotesAgainst] = useState(appData.votesAgainst(id, PAGE_ID));

    useEffect(() => {
        if (inView)
            appData.loadVotes(id, PAGE_ID);
        else
            appData.closeVotes(id, PAGE_ID);
    }, [inView]);

    useEffect(() => {
        return appData.onVotes(id, PAGE_ID, () => {
            setVotesFor(appData.votesFor(id, PAGE_ID));
            setVotesAgainst(appData.votesAgainst(id, PAGE_ID));
        });
    });

    return (
        <IonCard ref={ref}>
            <IonCardHeader>
                <IonItem className="head-item" lines="none">
                    <IonAvatar slot="start"><img src="https://ionicframework.com/docs/img/demos/avatar.svg" /></IonAvatar>
                    <IonLabel color="medium"><strong>@{username}</strong> - Just now</IonLabel>
                </IonItem>
                <IonCardTitle>{title}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
                <p>{description}</p>
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