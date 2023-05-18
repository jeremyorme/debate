import { IonBackButton, IonButtons, IonContent, IonHeader, IonItem, IonItemDivider, IonLabel, IonPage, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from "@ionic/react";
import { PageData } from "../app-data/PageData";
import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { VoteDirection } from "../app-data/IVote";
import { Link } from "react-router-dom";

interface ContainerProps {
    pageData: PageData;
}

interface ContainerParams {
    id: string;
}

enum UserSubPage {
    Groups = 'Groups',
    Votes = 'Votes',
    Identity = 'Identity'
}

const UserPage: React.FC<ContainerProps> = ({ pageData }) => {
    const { id } = useParams<ContainerParams>();
    const [userSubPage, setUserSubPage] = useState(UserSubPage.Groups);
    const [userVotes, setUserVotes] = useState(pageData.archivedVotes.entries(id));
    const [userGroups, setUserGroups] = useState([] as string[]);

    useEffect(() => {
        return pageData.onInit(() => {
            pageData.archivedVotes.load(id);
        });
    }, []);

    useEffect(() => {
        return () => {
            pageData.archivedVotes.close(id);
        };
    }, []);

    useEffect(() => {
        return pageData.archivedVotes.onUpdated(id, () => {
            setUserVotes(pageData.archivedVotes.entries(id).filter(v => v.direction != VoteDirection.Undecided));
        });
    }, []);

    useEffect(() => {
        const groupNames: Set<string> = new Set();
        for (const userVote of userVotes) {
            groupNames.add(userVote.groupName);
        }
        setUserGroups(Array.from(groupNames.values()));
    }, [userVotes]);

    const updateUserSubPage = (value: string | null | undefined) => {
        if (!value && value != '')
            return;

        const userSubPage: UserSubPage = (UserSubPage as any)[value];
        setUserSubPage(userSubPage);
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/home" />
                    </IonButtons>
                    <IonTitle>@{id.slice(-8)}</IonTitle>
                </IonToolbar>
                <IonSegment value={userSubPage} onIonChange={e => updateUserSubPage(e.detail.value)}>
                    {Object.keys(UserSubPage).map(s => <IonSegmentButton key={s} value={s}>{s}</IonSegmentButton>)}
                </IonSegment>
            </IonHeader>
            {userSubPage == UserSubPage.Groups ? <IonContent>
                <IonItemDivider>
                    <IonLabel>Voted in groups</IonLabel>
                </IonItemDivider>
                {userGroups.map(g => <IonItem>
                    <IonLabel>{g}</IonLabel>
                </IonItem>)}
            </IonContent> : null}
            {userSubPage == UserSubPage.Votes ? <IonContent>
                <IonItemDivider>
                    <IonLabel>Cast votes</IonLabel>
                </IonItemDivider>
                {userVotes.map(g => <IonItem>
                    <IonLabel>{g.direction == VoteDirection.For ? 'For' : 'Against'} ({g.groupName}) <Link to={'/debate/' + g._id + '/presentations'}>{g._id}</Link></IonLabel>
                </IonItem>)}
            </IonContent> : null}
            {userSubPage == UserSubPage.Identity ? <IonContent>
                <IonItemDivider>
                    <IonLabel>Public key</IonLabel>
                </IonItemDivider>
                <IonItem>
                    <IonLabel>{id}</IonLabel>
                </IonItem>
            </IonContent> : null}
        </IonPage>
    );
};

export default UserPage;