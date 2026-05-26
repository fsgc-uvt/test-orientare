const PUBLIC_KEY = 'fsgc-orientare-2026';
const SPREADSHEET_ID = '';

const LEADS_SHEET_NAME = 'Etapa 1 - Date candidati';
const RESULTS_SHEET_NAME = 'Etapa 2 - Rezultate test';

const FROM_ALIAS = 'contact.fsgc@e-uvt.ro';
const REPLY_TO = 'admitere.fsgc@e-uvt.ro';
const CONTACT_PHONE = '0256 592 132';
const FSGC_SITE = 'https://fsgc.uvt.ro/';
const ADMISSION_URL = 'https://admitere.uvt.ro/program/facultatea-de-stiinte-ale-guvernarii-si-comunicarii/';
const INSTAGRAM_URL = 'https://www.instagram.com/fsgc.uvt/';
const FACEBOOK_URL = 'https://www.facebook.com/fsgc.uvt';
const SEND_RESULT_EMAIL = true;

const LEAD_HEADERS = [
  'timestamp',
  'participantId',
  'prenume',
  'nume',
  'numeComplet',
  'email',
  'telefon',
  'scoala',
  'clasaStatut',
  'varsta',
  'profilLiceu',
  'judetTara',
  'localitate',
  'cunoastereFSGC',
  'sursa',
  'acordGDPR',
  'acordContact',
  'startedAt',
  'sentAt',
  'pageUrl',
  'language',
  'timezone',
  'screen',
  'userAgent'
];

const RESULT_HEADERS = [
  'timestamp',
  'participantId',
  'numeComplet',
  'prenume',
  'nume',
  'email',
  'startedAt',
  'finishedAt',
  'durataSecunde',
  'verdict',
  'incredere',
  'atentionare',
  'profilMixt',
  'top1Cod',
  'top1Program',
  'top1Scor',
  'top2Cod',
  'top2Program',
  'top2Scor',
  'top3Cod',
  'top3Program',
  'top3Scor',
  'AP',
  'CRP',
  'J',
  'MD',
  'PUB',
  'RISE',
  'SP',
  'SSEC',
  'sentAt',
  'pageUrl',
  'language',
  'timezone',
  'screen',
  'userAgent'
];

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({
        ok: false,
        error: 'doPost nu se ruleaza manual din editor. Publica Web App-ul si testeaza din site sau ruleaza testSetup().'
      });
    }

    const payload = JSON.parse((e.postData && e.postData.contents) || '{}');
    if (payload.publicKey !== PUBLIC_KEY) {
      throw new Error('Invalid public key.');
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const result = routeSubmission(payload);
      return jsonResponse({ ok: true, ...result });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    console.warn(err);
    return jsonResponse({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function testSetup() {
  const participantId = `manual-test-${Date.now()}`;
  routeSubmission({
    publicKey: PUBLIC_KEY,
    source: 'manual-test',
    stage: 'lead',
    sentAt: new Date().toISOString(),
    participantId,
    startedAt: new Date().toISOString(),
    demographics: {
      firstName: 'Ana',
      lastName: 'Test',
      fullName: 'Ana Test',
      email: Session.getActiveUser().getEmail() || 'test@example.com',
      phone: '0712345678',
      school: 'Liceu test',
      year: '12',
      age: '18',
      profile: 'Real',
      county: 'Timis',
      city: 'Timisoara',
      knowledge: 4,
      source: 'Test manual',
      gdprConsent: true,
      contactConsent: false
    },
    meta: {
      url: 'manual-test',
      language: 'ro',
      timezone: Session.getScriptTimeZone(),
      screen: '',
      userAgent: 'Apps Script manual test'
    }
  });

  routeSubmission({
    publicKey: PUBLIC_KEY,
    source: 'manual-test',
    stage: 'result',
    sentAt: new Date().toISOString(),
    participantId,
    startedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    finishedAt: new Date().toISOString(),
    identity: {
      fullName: 'Ana Test',
      firstName: 'Ana',
      lastName: 'Test',
      email: Session.getActiveUser().getEmail() || 'test@example.com'
    },
    result: {
      verdict: 'Test manual',
      confidence: 'good',
      cautionFlag: '',
      isMixed: false,
      gap: 12,
      top1Code: 'CRP',
      top1Program: 'Comunicare si relatii publice',
      top1Score: 82,
      top2Code: 'PUB',
      top2Program: 'Publicitate',
      top2Score: 70,
      top3Code: 'MD',
      top3Program: 'Media digitala',
      top3Score: 64,
      scores: { AP: 40, CRP: 82, J: 51, MD: 64, PUB: 70, RISE: 44, SP: 48, SSEC: 39 }
    },
    meta: {
      url: 'manual-test',
      language: 'ro',
      timezone: Session.getScriptTimeZone(),
      screen: '',
      userAgent: 'Apps Script manual test'
    }
  });

  return 'OK - au fost adaugate cate un rand de test in ambele sheet-uri.';
}

function doGet() {
  return jsonResponse({
    ok: true,
    service: 'FSGC Orientare',
    sheets: [LEADS_SHEET_NAME, RESULTS_SHEET_NAME]
  });
}

function routeSubmission(payload) {
  const stage = payload.stage;
  if (stage === 'lead') {
    appendLead(payload);
    sendLeadEmail(payload);
    return { stage };
  }
  if (stage === 'result') {
    appendResult(payload);
    if (SEND_RESULT_EMAIL) sendResultEmail(payload);
    return { stage };
  }
  throw new Error(`Unknown stage: ${stage}`);
}

function appendLead(payload) {
  const sheet = getSheet(LEADS_SHEET_NAME, LEAD_HEADERS);
  const d = payload.demographics || {};
  const meta = payload.meta || {};

  sheet.appendRow([
    new Date(),
    payload.participantId || '',
    d.firstName || '',
    d.lastName || '',
    d.fullName || [d.firstName, d.lastName].filter(Boolean).join(' '),
    d.email || '',
    d.phone || '',
    d.school || '',
    d.year || '',
    d.age || '',
    d.profile || '',
    d.county || '',
    d.city || '',
    d.knowledge || '',
    d.source || '',
    d.gdprConsent === true,
    d.contactConsent === true,
    payload.startedAt || '',
    payload.sentAt || '',
    meta.url || '',
    meta.language || '',
    meta.timezone || '',
    meta.screen || '',
    meta.userAgent || ''
  ]);
}

function appendResult(payload) {
  const sheet = getSheet(RESULTS_SHEET_NAME, RESULT_HEADERS);
  const identity = payload.identity || {};
  const result = payload.result || {};
  const scores = result.scores || {};
  const meta = payload.meta || {};

  sheet.appendRow([
    new Date(),
    payload.participantId || '',
    identity.fullName || '',
    identity.firstName || '',
    identity.lastName || '',
    identity.email || '',
    payload.startedAt || '',
    payload.finishedAt || '',
    getDurationSeconds(payload.startedAt, payload.finishedAt),
    result.verdict || '',
    result.confidence || '',
    result.cautionFlag || '',
    result.isMixed === true,
    result.top1Code || '',
    result.top1Program || '',
    result.top1Score || '',
    result.top2Code || '',
    result.top2Program || '',
    result.top2Score || '',
    result.top3Code || '',
    result.top3Program || '',
    result.top3Score || '',
    scores.AP || '',
    scores.CRP || '',
    scores.J || '',
    scores.MD || '',
    scores.PUB || '',
    scores.RISE || '',
    scores.SP || '',
    scores.SSEC || '',
    payload.sentAt || '',
    meta.url || '',
    meta.language || '',
    meta.timezone || '',
    meta.screen || '',
    meta.userAgent || ''
  ]);
}

function sendLeadEmail(payload) {
  const d = payload.demographics || {};
  if (!d.email || d.contactConsent !== true) return;
  if (hasMailBeenSent(payload.participantId, 'lead')) return;

  const firstName = d.firstName || 'Salut';
  const subject = 'Bine ai venit mai aproape de FSGC';
  const textBody =
    `Buna, ${firstName}!\n\n` +
    'Ne bucuram ca ai inceput testul de orientare FSGC. Esti cu un pas mai aproape sa descoperi programul care ti se potriveste.\n\n' +
    `Gasesti informatii despre admitere aici: ${ADMISSION_URL}\n\n` +
    `Ne poti scrie la ${REPLY_TO} sau ne poti suna la ${CONTACT_PHONE}.\n\n` +
    `FSGC: ${FSGC_SITE}\nInstagram: ${INSTAGRAM_URL}\nFacebook: ${FACEBOOK_URL}\n\n` +
    'Cu drag,\nEchipa FSGC - UVT';

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#1A1A1A;">
      <p>Buna, ${escapeHtml(firstName)}!</p>
      <p>Ne bucuram ca ai inceput testul de orientare FSGC. Esti cu un pas mai aproape sa descoperi programul care ti se potriveste.</p>
      <p><a href="${ADMISSION_URL}" style="color:#0A1628;font-weight:bold;">Vezi informatiile despre admiterea la FSGC</a></p>
      <p>
        Ai nevoie de noi? Ne poti scrie la <a href="mailto:${REPLY_TO}">${REPLY_TO}</a>
        sau ne poti suna la <strong>${CONTACT_PHONE}</strong>.
      </p>
      <p>
        <a href="${FSGC_SITE}">Site FSGC</a> ·
        <a href="${INSTAGRAM_URL}">Instagram</a> ·
        <a href="${FACEBOOK_URL}">Facebook</a>
      </p>
      <p>Cu drag,<br>Echipa FSGC - UVT</p>
    </div>
  `;

  sendFsgcEmail(d.email, subject, textBody, htmlBody);
  markMailSent(payload.participantId, 'lead');
}

function sendResultEmail(payload) {
  const identity = payload.identity || {};
  const result = payload.result || {};
  if (!identity.email || !result.top1Program) return;
  if (hasMailBeenSent(payload.participantId, 'result')) return;

  const firstName = identity.firstName || 'Salut';
  const subject = 'Rezultatul tau orientativ FSGC';
  const secondLine = result.isMixed && result.top2Program
    ? `Foarte aproape apare si ${result.top2Program}.`
    : 'Raportul complet ramane disponibil pe pagina testului.';

  const textBody =
    `Buna, ${firstName}!\n\n` +
    `Rezultatul tau orientativ indica drept prima potrivire: ${result.top1Program} (${result.top1Score}/100).\n` +
    `${secondLine}\n\n` +
    `Poti verifica informatiile de admitere aici: ${ADMISSION_URL}\n\n` +
    `Intrebari? ${REPLY_TO} · ${CONTACT_PHONE}\n` +
    `${FSGC_SITE}\n\n` +
    'Cu drag,\nEchipa FSGC - UVT';

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#1A1A1A;">
      <p>Buna, ${escapeHtml(firstName)}!</p>
      <p>Rezultatul tau orientativ indica drept prima potrivire:</p>
      <p style="font-size:18px;"><strong>${escapeHtml(result.top1Program)}</strong> · ${escapeHtml(result.top1Score)}/100</p>
      <p>${escapeHtml(secondLine)}</p>
      <p><a href="${ADMISSION_URL}" style="color:#0A1628;font-weight:bold;">Vezi informatiile de admitere</a></p>
      <p>Intrebari? <a href="mailto:${REPLY_TO}">${REPLY_TO}</a> · ${CONTACT_PHONE}</p>
      <p><a href="${FSGC_SITE}">fsgc.uvt.ro</a></p>
      <p>Cu drag,<br>Echipa FSGC - UVT</p>
    </div>
  `;

  sendFsgcEmail(identity.email, subject, textBody, htmlBody);
  markMailSent(payload.participantId, 'result');
}

function sendFsgcEmail(to, subject, textBody, htmlBody) {
  const options = {
    name: 'FSGC - UVT',
    replyTo: REPLY_TO,
    htmlBody
  };

  const aliases = GmailApp.getAliases();
  if (aliases.indexOf(FROM_ALIAS) !== -1) {
    options.from = FROM_ALIAS;
  }

  GmailApp.sendEmail(to, subject, textBody, options);
}

function getSheet(name, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  const hasHeaders = sheet.getLastRow() > 0;
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
  }

  return sheet;
}

function getSpreadsheet() {
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No active spreadsheet. Add SPREADSHEET_ID or bind the script to a Google Sheet.');
  return ss;
}

function getDurationSeconds(startedAt, finishedAt) {
  if (!startedAt || !finishedAt) return '';
  const start = new Date(startedAt).getTime();
  const finish = new Date(finishedAt).getTime();
  if (!start || !finish || finish < start) return '';
  return Math.round((finish - start) / 1000);
}

function hasMailBeenSent(participantId, stage) {
  if (!participantId) return false;
  return PropertiesService.getScriptProperties().getProperty(`mail_${stage}_${participantId}`) === '1';
}

function markMailSent(participantId, stage) {
  if (!participantId) return;
  PropertiesService.getScriptProperties().setProperty(`mail_${stage}_${participantId}`, '1');
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
