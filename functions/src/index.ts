import * as functions from 'firebase-functions';
import {adminDb} from './firebaseAdmin';
// import * as admin from 'firebase-admin';
// Start writing functions
// https://firebase.google.com/docs/functions/typescript
const fetchResults: any = async (id: string) => {
  const api_key = process.env.BRIGHTDATA_API_KEY;
  const res = await fetch(`https://api.brightdata.com/dca/dataset?id=${id}`,{
    method: 'GET',
    headers: {
      Authorization: `Bearer ${api_key}`,
    }
  })
  const data = await res.json();
  if (data.status === 'building' || data.status === 'collecting'){
    console.log('still building');
    return fetchResults(id);
  }
  return data;
}
export const onScraperComplete = functions.https.onRequest(async (request, response) => {
  console.log("SCRAPE COMPLETE >>> : ", request.body);

  const {success, id, finished } = request.body;
  if (!success){
    await adminDb.collection('scrapes').doc(id).set({
      status: 'error',
      updatedAt: finished,
    }, {
      merge: true,
    })
  }
  const data = await fetchResults(id)
  await adminDb.collection('searches').doc(id).set({
    status: "complete",
    updatedAt: finished,
    results: data,
  },{
    merge: true,
  })
  
  console.log("WOOHOO FULL CIRCLE")
  response.send("Hello from Firebase!");
});

// https://a3be-24-47-91-214.ngrok-free.app/brightdata-a27b3/us-central1/onScraperComplete