import { IonAvatar, IonBadge, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonItem, IonLabel, IonList, IonText, IonToolbar } from '@ionic/react';
import './MessageCard.css';
import ReactPlayer from 'react-player';
import { heartSharp, peopleSharp, starSharp, thumbsDownSharp, thumbsUpSharp } from 'ionicons/icons';
import { Link } from 'react-router-dom';

interface ContainerProps {
    id?: string;
    title?: string;
    description: string;
    username: string;
    url: string;
}

const MessageCard: React.FC<ContainerProps> = ({ id, title, description, username, url }) => {
    return (
        <IonCard>
            <IonCardHeader>
                <IonItem className="head-item" lines="none">
                    <IonAvatar slot="start"><img src="https://ionicframework.com/docs/img/demos/avatar.svg" /></IonAvatar>
                    <IonLabel color="medium"><strong>@{username}</strong> - Just now</IonLabel>
                </IonItem>
                {title ? <IonCardTitle>{title}</IonCardTitle> : null}
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
                    {id ? <IonItem>
                        <Link to={'/debate/' + id + '/messages/for'}>
                            <IonIcon size="small" icon={thumbsUpSharp} />
                        </Link>
                        <IonBadge className="count">11</IonBadge>
                    </IonItem> : null}
                    {id ? <IonItem>
                        <Link to={'/debate/' + id + '/messages/against'}>
                            <IonIcon size="small" icon={thumbsDownSharp} />
                        </Link>
                        <IonBadge className="count">11</IonBadge>
                    </IonItem> : null}
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

export default MessageCard;