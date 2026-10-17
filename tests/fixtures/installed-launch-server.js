import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';

const fixture = await readFile(new URL('installed-launch.html', import.meta.url));
const worker = await readFile(new URL('../../sw.js', import.meta.url));

createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1:4196');
    if (url.pathname === '/sim/sw.js') {
        response.writeHead(200, { 'Content-Type': 'application/javascript' });
        response.end(worker);
    } else if (url.pathname === '/sim/index.html') {
        response.writeHead(307, { Location: `/sim/${url.search}` });
        response.end();
    } else if (url.pathname === '/sim/') {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(fixture);
    } else {
        response.writeHead(404);
        response.end();
    }
}).listen(4196, '127.0.0.1', () => console.log('Installed launch fixture: http://127.0.0.1:4196/sim/'));
