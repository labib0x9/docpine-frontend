const WebSocket = require('ws');

async function test() {
    const res = await fetch('http://localhost:8080/sessions', { method: 'POST' });
    const data = await res.json();
    console.log('Session response:', data);
    const containerId = data.container_id;

    const ws = new WebSocket(`ws://localhost:8080/sessions/${containerId}/attach`);

    ws.on('open', () => {
        console.log('WS Open!');
        setTimeout(() => {
            console.log('Sending: ls (without newline)');
            ws.send('ls');
        }, 1000);

        setTimeout(() => {
            console.log('Sending: echo hello\\n (with newline)');
            ws.send('echo hello\n');
        }, 2500);

        setTimeout(() => {
            console.log('Sending: uname -a\\n (with newline)');
            ws.send('uname -a\n');
        }, 4000);

        setTimeout(() => {
            console.log('Closing ws...');
            ws.close();
        }, 6000);
    });

    ws.on('message', (msg) => {
        console.log('WS Received (raw):', JSON.stringify(msg.toString()));
    });

    ws.on('error', (err) => {
        console.error('WS Error:', err);
    });

    ws.on('close', (code, reason) => {
        console.log('WS Closed:', code, reason.toString());
    });
}

test();


// async function test() {
//   const res = await fetch('http://localhost:8080/sessions', { method: 'POST' });
//   const data = await res.json();
//   console.log('Session response:', data);
//   const containerId = data.container_id;

//   const ws = new WebSocket(`ws://localhost:8080/sessions/${containerId}/attach`, {
//     headers: {
//       Origin: 'http://localhost:5173'
//     }
//   });

//   ws.onopen = () => {
//     console.log('WS Open!');
//     setTimeout(() => {
//       console.log('Sending: ls\\n');
//       ws.send('ls\n');
//     }, 1000);

//     setTimeout(() => {
//       console.log('Sending: echo hello\\n');
//       ws.send('echo hello\n');
//     }, 2500);

//     setTimeout(() => {
//       console.log('Closing ws...');
//       ws.close();
//     }, 5000);
//   };

//   ws.onmessage = (e) => {
//     console.log('WS Received:', JSON.stringify(e.data));
//   };

//   ws.onerror = (err) => {
//     console.error('WS Error:', err);
//   };

//   ws.onclose = (e) => {
//     console.log('WS Closed:', e.code, e.reason);
//   };
// }

// test();
