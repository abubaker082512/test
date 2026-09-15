import { db, auth } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  limit as firestoreLimit,
  getDocs,
  onSnapshot
} from 'firebase/firestore';

class FirestoreQueryBuilder {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.conditions = [];
    this._limit = null;
    this._docId = null;
  }

  select(fields = '*') {
    return this;
  }

  eq(field, value) {
    if (this.collectionName === 'wallets' && (field === 'user_id' || field === 'id')) {
      this._docId = value;
    } else if (this.collectionName === 'crash_state' && field === 'id') {
      this._docId = 'current';
    } else if (this.collectionName === 'settings' && field === 'key') {
      this._docId = value;
    }
    this.conditions.push({ field, op: '==', value });
    return this;
  }

  limit(count) {
    this._limit = count;
    return this;
  }

  order(field, { ascending = true } = {}) {
    this._order = { field, ascending };
    return this;
  }

  async single() {
    try {
      if (this._docId) {
        const docRef = doc(db, this.collectionName, this._docId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return { data: { id: snap.id, ...snap.data() }, error: null };
        }
      }

      const collRef = collection(db, this.collectionName);
      let q = collRef;
      if (this.conditions.length > 0) {
        const clauses = this.conditions.map(c => where(c.field, c.op, c.value));
        q = query(collRef, ...clauses, firestoreLimit(1));
      }
      const snap = await getDocs(q);
      if (!snap.empty) {
        const firstDoc = snap.docs[0];
        return { data: { id: firstDoc.id, ...firstDoc.data() }, error: null };
      }
      return { data: null, error: { message: 'Row not found' } };
    } catch (error) {
      console.error('Firestore single() error:', error);
      return { data: null, error };
    }
  }

  async then(resolve, reject) {
    try {
      const collRef = collection(db, this.collectionName);
      let q = collRef;
      const clauses = [];
      if (this.conditions.length > 0) {
        clauses.push(...this.conditions.map(c => where(c.field, c.op, c.value)));
      }
      if (this._limit) {
        clauses.push(firestoreLimit(this._limit));
      }
      if (clauses.length > 0) {
        q = query(collRef, ...clauses);
      }

      const snap = await getDocs(q);
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));

      if (this._order) {
        list.sort((a, b) => {
          const vA = a[this._order.field];
          const vB = b[this._order.field];
          if (this._order.ascending) return vA > vB ? 1 : -1;
          return vA < vB ? 1 : -1;
        });
      }

      resolve({ data: list, error: null });
    } catch (error) {
      console.error('Firestore query error:', error);
      resolve({ data: [], error });
    }
  }

  async insert(data) {
    try {
      const items = Array.isArray(data) ? data : [data];
      const inserted = [];

      for (const item of items) {
        if (this.collectionName === 'wallets' && item.user_id) {
          const docRef = doc(db, 'wallets', item.user_id);
          await setDoc(docRef, { ...item, created_at: item.created_at || new Date().toISOString() }, { merge: true });
          inserted.push({ id: item.user_id, ...item });
        } else if (this.collectionName === 'users' && item.id) {
          const docRef = doc(db, 'users', item.id);
          await setDoc(docRef, { ...item, created_at: item.created_at || new Date().toISOString() }, { merge: true });
          inserted.push({ id: item.id, ...item });
        } else {
          const collRef = collection(db, this.collectionName);
          const docRef = await addDoc(collRef, {
            ...item,
            created_at: item.created_at || new Date().toISOString()
          });
          inserted.push({ id: docRef.id, ...item });
        }
      }

      return { data: Array.isArray(data) ? inserted : inserted[0], error: null };
    } catch (error) {
      console.error('Firestore insert error:', error);
      return { data: null, error };
    }
  }

  async update(patch) {
    try {
      if (this._docId) {
        const docRef = doc(db, this.collectionName, this._docId);
        await setDoc(docRef, { ...patch, updated_at: new Date().toISOString() }, { merge: true });
        return { data: [{ id: this._docId, ...patch }], error: null };
      }

      if (this.conditions.length > 0) {
        const collRef = collection(db, this.collectionName);
        const clauses = this.conditions.map(c => where(c.field, c.op, c.value));
        const q = query(collRef, ...clauses);
        const snap = await getDocs(q);
        const updated = [];
        for (const docSnap of snap.docs) {
          await updateDoc(docSnap.ref, { ...patch, updated_at: new Date().toISOString() });
          updated.push({ id: docSnap.id, ...docSnap.data(), ...patch });
        }
        return { data: updated, error: null };
      }

      return { data: null, error: { message: 'No target document specified for update' } };
    } catch (error) {
      console.error('Firestore update error:', error);
      return { data: null, error };
    }
  }
}

export const supabase = {
  from(collectionName) {
    return new FirestoreQueryBuilder(collectionName);
  },

  channel(channelName) {
    let unsubscribe = null;
    return {
      on(event, filterObj, callback) {
        const table = filterObj?.table;
        const filterStr = filterObj?.filter || '';
        let targetId = null;
        if (filterStr.includes('user_id=eq.')) {
          targetId = filterStr.split('user_id=eq.')[1]?.trim();
        }

        if (table === 'wallets' && targetId) {
          const docRef = doc(db, 'wallets', targetId);
          unsubscribe = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
              callback({ new: snap.data(), old: null });
            }
          }, () => {});
        } else if (table === 'crash_state') {
          const docRef = doc(db, 'crash_state', 'current');
          unsubscribe = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
              callback({ new: snap.data(), old: null });
            }
          }, () => {});
        }
        return this;
      },
      subscribe() {
        return this;
      },
      _unsubscribe: () => {
        if (unsubscribe) unsubscribe();
      }
    };
  },

  removeChannel(ch) {
    if (ch && typeof ch._unsubscribe === 'function') {
      ch._unsubscribe();
    }
  },

  auth: {
    async getSession() {
      const user = auth.currentUser;
      return {
        data: {
          session: user ? { user: { ...user, id: user.uid, email: user.email } } : null
        },
        error: null
      };
    },
    onAuthStateChange(cb) {
      const unsub = auth.onAuthStateChanged((user) => {
        const session = user ? { user: { ...user, id: user.uid, email: user.email } } : null;
        cb(user ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      });
      return { data: { subscription: { unsubscribe: unsub } } };
    }
  }
};
