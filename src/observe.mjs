const ROLES = {
  searchBox: 'searchbox',
  searchbox: 'searchbox',
  button: 'button',
  generic: 'generic',
  RootWebArea: 'document',
  document: 'document',
  heading: 'heading',
  StaticText: 'text',
};

export function mapRole(role) {
  if (!role) return '';
  if (ROLES[role]) return ROLES[role];
  return role.charAt(0).toLowerCase() + role.slice(1);
}

export function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export async function readSemantics(page) {
  const cdp = await page.context().newCDPSession(page);
  try {
    const evaluated = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.activeElement;
        const live = document.querySelector('[role="status"], [role="alert"], [aria-live]');
        const onBody = !el || el === document.body || el === document.documentElement;
        return {
          focusId: onBody ? 'body' : (el.id || ''),
          liveRegion: live ? live.textContent : '',
          appState: document.documentElement.dataset.appState || '',
        };
      })()`,
      returnByValue: true,
    });
    const dom = evaluated.result.value;
    const handle = await cdp.send('Runtime.evaluate', {
      expression: 'document.activeElement',
    });
    let role = '';
    let name = '';
    if (handle.result.objectId) {
      const tree = await cdp.send('Accessibility.getPartialAXTree', {
        objectId: handle.result.objectId,
        fetchRelatives: false,
      });
      const node = tree.nodes?.[0];
      role = mapRole(node?.role?.value || '');
      name = cleanText(node?.name?.value || '');
      await cdp.send('Runtime.releaseObject', { objectId: handle.result.objectId });
    }
    return {
      role,
      name,
      focusId: dom.focusId,
      liveRegion: cleanText(dom.liveRegion),
      appState: dom.appState,
    };
  } finally {
    await cdp.detach();
  }
}
