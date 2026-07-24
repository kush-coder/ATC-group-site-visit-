import React, { useState, useCallback } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle,
  IonIcon, IonButton, IonAlert, useIonViewWillEnter,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { addOutline, todayOutline } from 'ionicons/icons';
import VisitCard from '@/components/visits/VisitCard';
import { EmptyState, SkeletonList } from '@/components/common/ui';
import { visitRepo, imageRepo } from '@/services/database/repository';
import { fileService } from '@/services/filesystem/fileService';
import { todayIso } from '@/utils/format';
import { useApp } from '@/hooks/AppContext';
import type { ClientVisit, VisitImage } from '@/types/models';

const TodayVisits: React.FC = () => {
  const history = useHistory();
  const { toast, haptic } = useApp();
  const [visits, setVisits] = useState<ClientVisit[]>([]);
  const [images, setImages] = useState<Record<number, VisitImage | null>>({});
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await visitRepo.byDate(todayIso());
    setVisits(list);
    const imgs: Record<number, VisitImage | null> = {};
    for (const v of list) if (v.id) imgs[v.id] = await imageRepo.primaryFor(v.id);
    setImages(imgs);
    setLoading(false);
  }, []);

  useIonViewWillEnter(() => { load(); });

  const doDelete = async () => {
    if (deleteId == null) return;
    const imgs = await imageRepo.forVisit(deleteId);
    for (const im of imgs) await fileService.deleteFile(im.image_path);
    await visitRepo.delete(deleteId);
    setDeleteId(null);
    haptic('success');
    toast('Visit deleted', 'success');
    load();
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start"><IonBackButton defaultHref="/dashboard" /></IonButtons>
          <IonTitle style={{ fontWeight: 700 }}>Today's Visits</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="atc-page-pad">
          {loading ? <SkeletonList /> : visits.length === 0 ? (
            <EmptyState icon={todayOutline} title="No visits today"
              message="Your client visits will appear here. Start your first visit to capture an opportunity."
              action={<IonButton onClick={() => history.push('/visit/new')} style={{ '--border-radius': '12px' }}><IonIcon slot="start" icon={addOutline} /> Create New Visit</IonButton>}
            />
          ) : (
            <>
              <div className="atc-muted" style={{ margin: '4px 4px 12px' }}>{visits.length} visit{visits.length !== 1 ? 's' : ''} today</div>
              {visits.map((v) => (
                <VisitCard key={v.id} visit={v} primaryImage={v.id ? images[v.id] : null}
                  onOpen={() => history.push(`/visit/${v.id}`)}
                  onEdit={() => history.push(`/visit/edit/${v.id}`)}
                  onDelete={() => setDeleteId(v.id!)} />
              ))}
            </>
          )}
        </div>
      </IonContent>
      <IonAlert isOpen={deleteId != null} onDidDismiss={() => setDeleteId(null)}
        header="Delete visit?" message="This will permanently remove the visit and its images."
        buttons={[{ text: 'Cancel', role: 'cancel' }, { text: 'Delete', role: 'destructive', handler: doDelete }]} />
    </IonPage>
  );
};

export default TodayVisits;
