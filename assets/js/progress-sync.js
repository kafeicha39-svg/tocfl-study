import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {
  doc,
  getFirestore,
  onSnapshot,
  runTransaction,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyD27-Z0MPUJv57PccjuMCmwh3Ewse-A8TI',
  authDomain: 'tocfl-study-sync.firebaseapp.com',
  projectId: 'tocfl-study-sync',
  storageBucket: 'tocfl-study-sync.firebasestorage.app',
  messagingSenderId: '651166178081',
  appId: '1:651166178081:web:052a45bdd6bbff1cb87c60'
};

const progressPrefix = 'tocfl_';
const storage = window.tocflProgressStorage || localStorage;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let stopCloudListener = null;
let pendingWrite = Promise.resolve();

function collectLocalProgress(){
  const completed = {};
  for(let index = 0; index < localStorage.length; index++){
    const key = localStorage.key(index);
    if(key?.startsWith(progressPrefix) && localStorage.getItem(key) === '1'){
      completed[key] = true;
    }
  }
  return completed;
}

function mergeCloudIntoLocal(completed = {}){
  let changed = false;
  Object.entries(completed).forEach(([key, done]) => {
    if(done === true && key.startsWith(progressPrefix) && storage.getItem(key) !== '1'){
      localStorage.setItem(key, '1');
      changed = true;
    }
  });

  if(changed){
    window.dispatchEvent(new CustomEvent('tocfl-progress-updated', {
      detail: {source: 'cloud'}
    }));
  }
}

function progressReference(user){
  return doc(database, 'users', user.uid, 'progress', 'current');
}

async function mergeLocalIntoCloud(user){
  const reference = progressReference(user);
  const localCompleted = collectLocalProgress();

  await runTransaction(database, async transaction => {
    const snapshot = await transaction.get(reference);
    const cloudCompleted = snapshot.exists() ? snapshot.data().completed || {} : {};
    transaction.set(reference, {
      completed: {...cloudCompleted, ...localCompleted},
      updatedAt: serverTimestamp(),
      schemaVersion: 1
    });
  });
}

function queueCloudWrite(){
  if(!currentUser) return;

  pendingWrite = pendingWrite
    .catch(() => undefined)
    .then(() => mergeLocalIntoCloud(currentUser))
    .then(() => setStatus('同期済み'))
    .catch(error => {
      console.error('Progress sync failed:', error);
      setStatus('同期を再試行します');
    });
}

function createSyncBar(){
  const root = document.createElement('aside');
  root.className = 'sync-bar';
  root.setAttribute('aria-label', '学習進捗の同期');
  root.innerHTML = `
    <div class="container sync-bar-inner">
      <div>
        <strong>学習進捗</strong>
        <span class="sync-status" id="syncStatus">この端末内に保存中</span>
        <span class="sync-user" id="syncUser"></span>
      </div>
      <button type="button" class="sync-button" id="syncAction">Googleで同期</button>
    </div>`;
  document.body.insertBefore(root, document.body.firstChild);
  return root;
}

const syncBar = createSyncBar();
const statusElement = syncBar.querySelector('#syncStatus');
const userElement = syncBar.querySelector('#syncUser');
const actionButton = syncBar.querySelector('#syncAction');

function setStatus(message){
  statusElement.textContent = message;
}

function showSignedOut(){
  setStatus('この端末内に保存中');
  userElement.textContent = '';
  actionButton.textContent = 'Googleで同期';
  actionButton.disabled = false;
}

function showSignedIn(user){
  setStatus(navigator.onLine ? '同期中…' : 'オフライン・端末内に保存中');
  userElement.textContent = user.displayName ? `・${user.displayName}` : '';
  actionButton.textContent = 'ログアウト';
  actionButton.disabled = false;
}

function signInErrorMessage(error){
  switch(error?.code){
    case 'auth/popup-closed-by-user':
      return 'ログインをキャンセルしました';
    case 'auth/popup-blocked':
      return 'ポップアップを許可して再試行してください';
    case 'auth/unauthorized-domain':
      return '公開サイトからログインしてください';
    default:
      return 'ログインできませんでした';
  }
}

actionButton.addEventListener('click', async () => {
  actionButton.disabled = true;
  try{
    if(currentUser){
      await signOut(auth);
    }else{
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, provider);
    }
  }catch(error){
    console.error('Sign-in failed:', error);
    setStatus(signInErrorMessage(error));
    actionButton.disabled = false;
  }
});

window.addEventListener('tocfl-progress-local-change', queueCloudWrite);
window.addEventListener('online', () => {
  if(currentUser){
    setStatus('同期中…');
    queueCloudWrite();
  }
});
window.addEventListener('offline', () => {
  if(currentUser) setStatus('オフライン・端末内に保存中');
});

onAuthStateChanged(auth, async user => {
  currentUser = user;
  if(stopCloudListener){
    stopCloudListener();
    stopCloudListener = null;
  }

  if(!user){
    showSignedOut();
    return;
  }

  showSignedIn(user);
  try{
    await mergeLocalIntoCloud(user);
    stopCloudListener = onSnapshot(progressReference(user), snapshot => {
      if(snapshot.exists()) mergeCloudIntoLocal(snapshot.data().completed);
      setStatus(navigator.onLine ? '同期済み' : 'オフライン・端末内に保存中');
    }, error => {
      console.error('Progress listener failed:', error);
      setStatus('同期を再試行します');
    });
  }catch(error){
    console.error('Initial progress sync failed:', error);
    setStatus('同期を再試行します');
  }
});
