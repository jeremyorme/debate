import { IonAvatar, IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonItem, IonLabel, IonList, IonText, IonToolbar } from '@ionic/react';
import './DebateCard.css';
import ReactPlayer from 'react-player';
import { heartSharp, peopleSharp, starSharp, thumbsDownSharp, thumbsUpSharp } from 'ionicons/icons';

interface ContainerProps {
    title: string;
    description: string;
    username: string;
    url: string;
}

const DebateCard: React.FC<ContainerProps> = ({ title, description, username, url }) => {
    return (
        <IonCard>
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
            {url && ReactPlayer.canPlay(url) ? <div className='player-wrapper'>
                <ReactPlayer className='react-player' url={url} width='100%' height='100%' />
            </div> : null}
            <IonToolbar>
                <IonItem className="counts">
                    <IonItem>
                        <IonIcon size="small" icon={thumbsUpSharp} />
                        <IonBadge className="count">11</IonBadge>
                    </IonItem>
                    <IonItem>
                        <IonIcon size="small" icon={thumbsDownSharp} />
                        <IonBadge className="count">11</IonBadge>
                    </IonItem>
                    <IonItem>
                        <IonIcon size="small" icon={starSharp} />
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