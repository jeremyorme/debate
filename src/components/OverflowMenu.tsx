import { IonButton, IonIcon, IonPopover, IonContent, IonList, IonItem, IonSelect, IonSelectOption } from "@ionic/react";
import { ellipsisHorizontalSharp } from "ionicons/icons";

export enum SortBy {
    Time = 'Time',
    Popularity = 'Popularity'
}

interface ContainerProps {
    id: string;
    sortBy: SortBy;
    onSortByChanged: (sortBy: SortBy) => void;
}

const OverflowMenu: React.FC<ContainerProps> = ({ id, sortBy, onSortByChanged }) => {

    const updateSortBy = (value: string | undefined) => {
        if (!value)
            return;

        onSortByChanged((SortBy as any)[value]);
    }

    return <div>
        <IonButton id={id + '-overflow-actions-button'}>
            <IonIcon icon={ellipsisHorizontalSharp} />
        </IonButton>
        <IonPopover trigger={id + '-overflow-actions-button'} triggerAction="click">
            <IonContent>
                <IonList>
                    <IonItem>
                        <IonSelect value={sortBy} interface="popover" onIonChange={e => updateSortBy(e.detail.value)}>
                            {Object.keys(SortBy).map(order => <IonSelectOption key={order} value={order}>Sort by {order}</IonSelectOption>)}
                        </IonSelect>
                    </IonItem>
                </IonList>
            </IonContent>
        </IonPopover>
    </div>
};

export default OverflowMenu;