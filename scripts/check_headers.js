
import https from 'https';

const url = "https://jjdfqytmuiqxnsqlkvoy.supabase.co/storage/v1/object/public/snapverse-files/uploads/file_1771242337122_gln1xs2.mp4";

const req = https.request(url, { method: 'HEAD' }, (res) => {
    console.log('Content-Type:', res.headers['content-type']);
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
