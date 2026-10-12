export const escapeXml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const escapeHtml = escapeXml;
export const q = (s) => `„${s}”`; // polski cudzysłów używany w arkuszach CKE
export const joinPl = (items, last = 'i') => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} ${last} ${items[items.length - 1]}`);
export const formatPln = (n) => Number(n).toFixed(2);
export const indent = (text, n) => text.split('\n').map((l) => (l ? ' '.repeat(n) + l : l)).join('\n');
