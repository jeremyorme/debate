import { IonAvatar, IonButton, IonButtons, IonContent, IonDatetime, IonHeader, IonIcon, IonInput, IonItem, IonItemDivider, IonLabel, IonModal, IonTextarea, IonToolbar } from '@ionic/react';
import { add, peopleSharp, remove } from 'ionicons/icons';
import { useState } from 'react';
import { dbEntryDefaults } from '../app-data/IDbEntry';
import { IGroup, IDebate } from '../app-data/IDebate';
import { PageData } from '../app-data/PageData';
import './DebateAddModal.css';

interface ContainerProps {
    pageData: PageData;
    isOpen: boolean;
    setIsOpen: (x: boolean) => void;
}

const DebateAddModal: React.FC<ContainerProps> = ({ pageData, isOpen, setIsOpen }) => {
    const today = new Date();
    const addDay = (d: Date) => {
        const d_next = new Date();
        d_next.setDate(d.getDate() + 1);
        return d_next;
    }

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState(today);
    const [endTime, setEndTime] = useState(addDay(today));
    const [groups, setGroups] = useState(new Array<IGroup>());

    const totalPercent = groups.map(g => g.percent).reduce((p, c) => p + c, 0);

    const updateTitle = (value: string | null | undefined) => {
        if (!value && value != '')
            return;

        setTitle(value);
    };

    const updateDescription = (value: string | null | undefined) => {
        if (!value && value != '')
            return;

        setDescription(value);
    };

    const updateStartTime = (value: string | string[] | null | undefined) => {
        const s = value as string;
        if (!s && s != '')
            return;

        setStartTime(new Date(s));
    };

    const updateEndTime = (value: string | string[] | null | undefined) => {
        const s = value as string;
        if (!s && s != '')
            return;

        setEndTime(new Date(s));
    };

    const updateName = (i: number, value: string | null | undefined) => {
        if (!value)
            return;

        setGroups([...groups.slice(0, i), { name: value, percent: groups[i].percent }, ...groups.slice(i + 1)])
    };

    const updatePercent = (i: number, value: string | null | undefined) => {
        if (!value)
            return;

        let newPercent = parseFloat(value);
        if (Number.isNaN(newPercent))
            return;

        // Limit total % to 100
        const oldPercent = groups[i].percent;
        if (totalPercent - oldPercent + newPercent > 100)
            newPercent = 100 - (totalPercent - oldPercent);

        setGroups([...groups.slice(0, i), { name: groups[i].name, percent: newPercent }, ...groups.slice(i + 1)])
    };

    const addDebate = () => {
        const debate: IDebate = {
            ...dbEntryDefaults,
            title,
            description,
            groups,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString()
        };
        pageData.debates.addEntry(debate);
        setIsOpen(false);
    }
    return (
        <IonModal isOpen={isOpen}>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton onClick={() => setIsOpen(false)}>Cancel</IonButton>
                    </IonButtons>
                    <IonButtons slot="end">
                        <IonButton disabled={title.length == 0} onClick={() => addDebate()}>
                            <IonIcon icon={add} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonItem>
                    <IonAvatar slot="start"><img src="https://ionicframework.com/docs/img/demos/avatar.svg" /></IonAvatar>
                    <IonInput placeholder="What say you?" value={title} onIonChange={e => updateTitle(e.detail.value)} />
                </IonItem>
                <IonItem>
                    <IonTextarea autoGrow={true} placeholder="Tell me more..." value={description} onIonChange={e => updateDescription(e.detail.value)} />
                </IonItem>

                <IonItemDivider>
                    <IonLabel>Voting groups</IonLabel>
                </IonItemDivider>

                {totalPercent < 100 ? <IonItem>
                    <IonIcon slot="start" icon={peopleSharp} />
                    <IonInput color="medium" value="Default" readonly={true} />
                    <div style={{ 'width': '50px' }}>
                        <IonInput type="number" color="medium" value={100 - totalPercent} readonly={true} />
                    </div>
                    <IonLabel color="medium">%</IonLabel>
                    <IonButton slot="end" onClick={() => setGroups([...groups, { name: '', percent: 0 }])}>
                        <IonIcon icon={add} />
                    </IonButton>
                </IonItem> : null}
                {groups.map((g, i) => <IonItem>
                    <IonIcon slot="start" icon={peopleSharp} />
                    <IonInput color="medium" placeholder="Group name" value={g.name} onIonChange={e => updateName(i, e.detail.value)} />
                    <div style={{ 'width': '50px' }}>
                        <IonInput type="number" color="medium" value={g.percent} onIonChange={e => updatePercent(i, e.detail.value)} />
                    </div>
                    <IonLabel color="medium">%</IonLabel>
                    <IonButton slot="end" onClick={() => setGroups([...groups.slice(0, i), ...groups.slice(i + 1)])}>
                        <IonIcon icon={remove} />
                    </IonButton>
                </IonItem>)}

                <IonItemDivider>
                    <IonLabel>Schedule</IonLabel>
                </IonItemDivider>

                <IonDatetime presentation="date-time" preferWheel={true} size="cover" min={today.toISOString()} value={startTime.toISOString()} onIonChange={e => updateStartTime(e.detail.value)}>
                    <span slot="title">Start time</span>
                </IonDatetime>
                <IonDatetime presentation="date-time" preferWheel={true} size="cover" min={addDay(startTime).toISOString()} value={endTime.toISOString()} onIonChange={e => updateEndTime(e.detail.value)}>
                    <span slot="title">End time</span>
                </IonDatetime>
            </IonContent>
        </IonModal>
    );
};

export default DebateAddModal;