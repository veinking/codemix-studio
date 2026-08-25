import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const requireText = (source, text, label) => {
  if (!source.includes(text)) throw new Error(`${label}: missing ${JSON.stringify(text)}`);
};
const rejectText = (source, text, label) => {
  if (source.includes(text)) throw new Error(`${label}: should not contain ${JSON.stringify(text)}`);
};

const landing = read('src/pages/Landing.tsx');
const auth = read('src/pages/Auth.tsx');
const dialog = read('src/components/AuthDialog.tsx');
const connect = read('src/components/PocketBIConnectSection.tsx');

requireText(landing, '/auth?mode=login', 'Landing sign-in route');

for (const [label, source] of [
  ['Full-page auth', auth],
  ['IDE auth dialog', dialog],
]) {
  requireText(source, 'PocketBIConnectSection', label);
  requireText(source, 'markDirectPocketBISession', `${label} direct fallback`);
  rejectText(source, 'beginPocketBIOAuth', `${label} must use shared PocketBI connect component`);
  rejectText(source, 'isPocketBIOAuthConfigured', `${label} must use shared PocketBI connect component`);
}

requireText(connect, 'Continue with PocketBI ID', 'Shared PocketBI connect UI');
requireText(connect, 'beginPocketBIOAuth', 'Shared PocketBI connect behavior');
requireText(connect, 'isPocketBIOAuthConfigured', 'Shared PocketBI config guard');
requireText(connect, 'Sign in or create your PocketBI ID on PocketBI', 'Shared PocketBI identity copy');

requireText(auth, 'Back to bIDE', 'Full-page auth escape');
requireText(auth, "onClick={() => navigate('/')}", 'Full-page auth home navigation');
requireText(auth, 'Continue as Guest', 'Full-page auth guest escape');
requireText(auth, 'Create PocketBI ID here', 'Full-page auth direct fallback');

console.log('bIDE auth entry V1 validation passed.');
