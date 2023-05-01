import { CheckboxChangeEventDetail, CheckboxCustomEvent, IonCheckbox, IonContent, IonItem, IonLabel, IonList, IonListHeader, IonPopover } from "@ionic/react"
import { useEffect, useState } from "react";

interface ContainerProps {
    trigger: string;
    title: string;
    items: string[];
    idx: number;
    onChange: (idx: number) => void;
}

const ItemsPopover: React.FC<ContainerProps> = ({ trigger, title, items, idx, onChange }) => {
    const [checks, setChecks] = useState(items.map((_, i) => false));

    const updateCheck = (i: number) => {
        const newChecks = checks.map(_ => false);
        newChecks[i] = !checks[i];
        setChecks(newChecks);
    };

    useEffect(() => {
        onChange(checks.findIndex(c => c));
    }, [checks]);

    return (
        <IonPopover trigger={trigger} triggerAction="click">
            <IonContent>
                <IonList>
                    <IonListHeader>
                        <IonLabel>{title}</IonLabel>
                    </IonListHeader>
                    {items.map((item, i) => <IonItem key={i}>
                        <IonCheckbox slot="start" checked={i == idx} onClick={e => updateCheck(i)} />
                        <IonLabel>{item}</IonLabel>
                    </IonItem>)}
                </IonList>
            </IonContent>
        </IonPopover>
    );
};

export default ItemsPopover;