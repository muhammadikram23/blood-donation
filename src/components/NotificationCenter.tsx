import React, { useEffect, useState } from 'react';
import { AppNotification } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { formatRelativeTime } from '../utils/bloodCompatibility';
import {
  Bell,
  CheckCircle2,
  Trash2,
  Heart,
  AlertTriangle,
  Info,
  CheckCheck,
  X,
  Mail
} from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRequestById?: (requestId: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onSelectRequestById,
}) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: AppNotification[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as AppNotification);
        });
        // Sort client side by createdAt desc
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching notifications:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleMarkAsRead = async (notifId: string) => {
    try {
      const ref = doc(db, 'notifications', notifId);
      await updateDoc(ref, { isRead: true });
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleDeleteNotif = async (notifId: string) => {
    try {
      const ref = doc(db, 'notifications', notifId);
      await deleteDoc(ref);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!notifications.length) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        if (!n.isRead) {
          batch.update(doc(db, 'notifications', n.id), { isRead: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="notification-center-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-[32px] max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl border border-[#E5E1D8] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F1E9E0] flex items-center justify-between bg-[#F9F7F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#A63D40] flex items-center justify-center text-white">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-serif text-[#3C3836]">Notifications Center</h2>
              <p className="text-xs text-[#7C756E]">Live emergency alerts and donor updates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-bold uppercase tracking-wider text-[#A63D40] hover:text-[#8E3235] flex items-center gap-1 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#7C756E] hover:text-[#3C3836] rounded-xl hover:bg-[#E5E1D8] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-8 text-center text-xs font-bold uppercase tracking-widest text-[#7C756E]">Loading alerts...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Bell className="w-10 h-10 text-[#E5E1D8] mx-auto" />
              <p className="text-sm font-bold font-serif text-[#3C3836]">No Notifications Yet</p>
              <p className="text-xs text-[#7C756E] max-w-xs mx-auto">
                You will be notified when nearby blood requests match your blood type or when requesters respond to your pledges.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  handleMarkAsRead(notif.id);
                  if (notif.requestId && onSelectRequestById) {
                    onSelectRequestById(notif.requestId);
                    onClose();
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative group flex items-start gap-3 ${
                  !notif.isRead
                    ? 'bg-[#F1E9E0] border-[#A63D40]/30 shadow-xs'
                    : 'bg-white border-[#E5E1D8] hover:border-[#3C3836]/30'
                }`}
              >
                {/* Icon based on type */}
                <div className="mt-0.5 shrink-0">
                  {notif.type === 'interest_received' || notif.type === 'interest_accepted' ? (
                    <div className="w-8 h-8 rounded-xl bg-[#A63D40] text-white flex items-center justify-center">
                      <Heart className="w-4 h-4 fill-current" />
                    </div>
                  ) : notif.type === 'nearby_request' ? (
                    <div className="w-8 h-8 rounded-xl bg-[#7D8471] text-white flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-[#3C3836] text-white flex items-center justify-center">
                      <Info className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 pr-6">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-xs font-bold font-serif ${!notif.isRead ? 'text-[#A63D40]' : 'text-[#3C3836]'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-[10px] text-[#7C756E] font-medium">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-[#3C3836]/80 mt-1 leading-relaxed">{notif.message}</p>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNotif(notif.id);
                  }}
                  className="absolute right-2 top-2 p-1 text-[#7C756E] hover:text-[#A63D40] opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete notification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
