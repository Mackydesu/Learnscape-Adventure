import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function createHarness({ closeSucceeds = false, closeThrows = false, fullscreen = false, hasDialog = true } = {}) {
    const start = html.indexOf('            const showExitGameFallback =');
    const end = html.indexOf('            introFullscreenToggle?.addEventListener', start);
    assert.ok(start >= 0 && end > start);
    const listeners = new Map();
    const timers = [];
    const calls = [];
    const button = (name) => ({
        addEventListener(event, callback) { listeners.set(`${name}:${event}`, callback); },
        focus() { calls.push(`${name}:focus`); },
    });
    const dialog = {
        open: false,
        showModal() { this.open = true; calls.push('dialog:show'); },
        close() { this.open = false; calls.push('dialog:close'); },
    };
    if (!hasDialog) delete dialog.showModal;
    const context = {
        introSettingsExitButton: button('exit'),
        exitGameContinueButton: button('continue'),
        exitGameDialog: dialog,
        introSettingsPanel: { hidden: false },
        introSettingsButton: { setAttribute(name, value) { calls.push(`${name}:${value}`); } },
        isFullscreenActive: () => fullscreen,
        syncFullscreenClass: () => calls.push('fullscreen:sync'),
        document: { exitFullscreen() { calls.push('fullscreen:exit'); return Promise.resolve(); } },
        window: {
            closed: false,
            close() {
                calls.push('window:close');
                if (closeThrows) throw new Error('Blocked');
                this.closed = closeSucceeds;
            },
            setTimeout(callback) { timers.push(callback); },
            alert() { calls.push('alert'); },
        },
    };
    vm.runInNewContext(html.slice(start, end), context);
    return { context, listeners, timers, calls, dialog };
}

test('Exit Game is available in the shared settings menu', () => {
    assert.match(html, /class="intro-settings-exit-button"[^>]*>Exit Game<\/button>/);
    assert.match(html, /class="exit-game-dialog"/);
});

test('Exit Game attempts to close immediately and shows no fallback if successful', () => {
    const h = createHarness({ closeSucceeds: true, fullscreen: true });
    h.listeners.get('exit:click')();
    assert.deepEqual(h.calls, ['window:close']);
    h.timers[0]();
    assert.deepEqual(h.calls, ['window:close']);
});

test('blocked close shows instructions, leaves fullscreen and can resume playing', async () => {
    const h = createHarness({ closeThrows: true, fullscreen: true });
    h.listeners.get('exit:click')();
    h.timers[0]();
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(h.context.introSettingsPanel.hidden, true);
    assert.equal(h.dialog.open, true);
    assert.ok(h.calls.includes('fullscreen:exit'));
    assert.ok(h.calls.includes('continue:focus'));
    h.listeners.get('continue:click')();
    assert.equal(h.dialog.open, false);
});

test('blocked close still provides instructions without dialog support', () => {
    const h = createHarness({ hasDialog: false });
    h.listeners.get('exit:click')();
    h.timers[0]();
    assert.ok(h.calls.includes('alert'));
});
