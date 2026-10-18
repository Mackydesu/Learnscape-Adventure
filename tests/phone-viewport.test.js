import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('        // The game scenes are composed');
const end = html.indexOf('    </script>', start);
assert.ok(start >= 0 && end > start, 'phone viewport setup must be present');
const setup = html.slice(start, end);

function createViewport({ userAgent, orientation, width = 800, height = 360 }) {
    const listeners = new Map();
    const orientationListeners = new Map();
    const classes = new Set();
    const viewport = { content: 'width=device-width, initial-scale=1.0' };
    const screenOrientation = orientation ? {
        type: orientation,
        addEventListener: (name, handler) => orientationListeners.set(name, handler),
    } : undefined;
    const window = {
        innerWidth: width,
        innerHeight: height,
        screen: { orientation: screenOrientation },
        addEventListener: (name, handler) => listeners.set(name, handler),
    };
    const document = {
        querySelector: () => viewport,
        documentElement: { classList: { toggle(name, active) { active ? classes.add(name) : classes.delete(name); } } },
    };
    vm.runInNewContext(setup, { document, navigator: { userAgent }, window });
    return { window, viewport, classes, listeners, orientationListeners };
}

test('Android phones use the desktop scene viewport in landscape and restore portrait', () => {
    const phone = createViewport({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Mobile)', orientation: 'landscape-primary' });
    assert.equal(phone.viewport.content, 'width=1366');
    assert.equal(phone.classes.has('is-phone-landscape'), true);

    phone.window.screen.orientation.type = 'portrait-primary';
    phone.orientationListeners.get('change')();
    assert.equal(phone.viewport.content, 'width=device-width, initial-scale=1.0');
    assert.equal(phone.classes.has('is-phone-landscape'), false);

    phone.window.screen.orientation.type = 'landscape-secondary';
    phone.listeners.get('pageshow')();
    assert.equal(phone.viewport.content, 'width=1366');
});

test('orientation fallback follows the viewport when the screen API is unavailable', () => {
    const phone = createViewport({ userAgent: 'Android 13 Mobile', width: 360, height: 800 });
    assert.equal(phone.viewport.content, 'width=device-width, initial-scale=1.0');
    phone.window.innerWidth = 800;
    phone.window.innerHeight = 360;
    phone.listeners.get('resize')();
    assert.equal(phone.viewport.content, 'width=1366');
});

test('desktop browsers and Android tablets keep their existing viewport', () => {
    for (const userAgent of ['Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Mozilla/5.0 (Linux; Android 14; Tablet)']) {
        const device = createViewport({ userAgent, orientation: 'landscape-primary' });
        assert.equal(device.viewport.content, 'width=device-width, initial-scale=1.0');
        assert.equal(device.listeners.size, 0);
    }
});
