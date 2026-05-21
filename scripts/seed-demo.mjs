/**
 * Seeds a DEMO collection in Firestore for testing.
 * Creates a parallel set of collections prefixed with "DEMO_"
 * Run: node scripts/seed-demo.mjs
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyDYkA79H18i2CoORpCHxxkhPDhQYnnxP54',
  authDomain:        'qa-module-shoham.firebaseapp.com',
  projectId:         'qa-module-shoham',
  storageBucket:     'qa-module-shoham.firebasestorage.app',
  messagingSenderId: '224873227518',
  appId:             '1:224873227518:web:0db295848b1888793ff1af',
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// Helper: days from today as DD/MM/YYYY
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function today() { return daysFromNow(0); }

const DEMO_TOOLS = [
  { '#':'1','שם המכשיר':'טרמוקפל DEMO','מספר סידורי':'DEMO-001','תאריך בדיקה':daysFromNow(-30),'מועד הבא':daysFromNow(30),'מיקום':'חדר שטיפות','תדירות':'שנתי','מעבדה':'Controtec' },
  { '#':'2','שם המכשיר':'קליבר אלקטרוני DEMO','מספר סידורי':'DEMO-002','תאריך בדיקה':daysFromNow(-60),'מועד הבא':daysFromNow(-5),'מיקום':'חדר QC','תדירות':'שנתי','מעבדה':'P.K Labs' },
  { '#':'3','שם המכשיר':'מד לחץ DEMO','מספר סידורי':'DEMO-003','תאריך בדיקה':daysFromNow(-300),'מועד הבא':daysFromNow(45),'מיקום':'אולם ייצור','תדירות':'שנתי','מעבדה':'P.K Labs' },
  { '#':'4','שם המכשיר':'מד טמפרטורה DEMO','מספר סידורי':'DEMO-004','תאריך בדיקה':today(),'מועד הבא':'לא בשימוש','מיקום':'מחסן','תדירות':'-','מעבדה':'' },
  { '#':'5','שם המכשיר':'מיקרוסקופ DEMO','מספר סידורי':'DEMO-005','תאריך בדיקה':daysFromNow(-10),'מועד הבא':daysFromNow(200),'מיקום':'חדר נקי','תדירות':'שנתי','מעבדה':'P.K Labs' },
];

const DEMO_MACHINES = [
  { 'מ. מכונה':'W001','שם':'AL 120 DEMO','יצרן':'Alpha Laser','תאריך כיול':daysFromNow(-90),'מועד הבא':daysFromNow(20),'מיקום':'אולם ריתוך' },
  { 'מ. מכונה':'W002','שם':'AL IN 150 DEMO','יצרן':'Alpha Laser','תאריך כיול':daysFromNow(-200),'מועד הבא':daysFromNow(-10),'מיקום':'אולם ריתוך' },
  { 'מ. מכונה':'W003','שם':'OEM 150 DEMO','יצרן':'OR Laser','תאריך כיול':'','מועד הבא':'לא בשימוש','מיקום':'מחסן' },
  { 'מ. מכונה':'EQ001','שם':'LOGO DEMO','יצרן':'SISMA','תאריך כיול':daysFromNow(-30),'מועד הבא':daysFromNow(180),'מיקום':'אולם סימון' },
];

const DEMO_FILTERS = [
  { 'מ. פילטר':'F001','מכונה':'AL 120 DEMO','מ. מכונה':'W001','מיקום':'אולם ריתוך','תדירות':'רבעוני','תאריך אחרון':daysFromNow(-30) },
  { 'מ. פילטר':'F002','מכונה':'AL IN 150 DEMO','מ. מכונה':'W002','מיקום':'אולם ריתוך','תדירות':'רבעוני','תאריך אחרון':daysFromNow(-100) },
  { 'מ. פילטר':'F003','מכונה':'OEM 150 DEMO','מ. מכונה':'W003','מיקום':'מחסן','תדירות':'לא בשימוש','תאריך אחרון':'' },
  { 'מ. פילטר':'F004','מכונה':'LOGO DEMO','מ. מכונה':'EQ001','מיקום':'אולם סימון','תדירות':'רבעוני','תאריך אחרון':daysFromNow(-10) },
];

const DEMO_SUPPLIERS = [
  { '#':'1','שם ספק':'ספק דמו א','תעודת ISO':'9001','תוקף עד':daysFromNow(200),'הערות':'Laser systems' },
  { '#':'2','שם ספק':'ספק דמו ב','תעודת ISO':'13485','תוקף עד':daysFromNow(50),'הערות':'Medical' },
  { '#':'3','שם ספק':'ספק דמו ג','תעודת ISO':'9001','תוקף עד':daysFromNow(-5),'הערות':'Chemicals' },
  { '#':'4','שם ספק':'ספק דמו ד','תעודת ISO':'-','תוקף עד':'-','הערות':'Packaging' },
  { '#':'5','שם ספק':'ספק דמו ה','תעודת ISO':'17025','תוקף עד':daysFromNow(80),'הערות':'Calibrations' },
];

async function clearCollection(name) {
  const snap = await getDocs(collection(db, name));
  for (const d of snap.docs) await deleteDoc(d.ref);
}

async function seedCollection(name, docs) {
  await clearCollection(name);
  for (const d of docs) await addDoc(collection(db, name), d);
  console.log(`  ✓ ${name}: ${docs.length} מסמכים`);
}

console.log('מייצר נתוני DEMO ב-Firestore...\n');

await seedCollection('DEMO_Tools',     DEMO_TOOLS);
await seedCollection('DEMO_Machines',  DEMO_MACHINES);
await seedCollection('DEMO_Filters',   DEMO_FILTERS);
await seedCollection('DEMO_Suppliers', DEMO_SUPPLIERS);

console.log('\n✅ DEMO data ready!');
console.log('כדי להשתמש בנתוני DEMO, שנה את שמות ה-collections באפליקציה ל-DEMO_Tools וכו\'');
process.exit(0);
