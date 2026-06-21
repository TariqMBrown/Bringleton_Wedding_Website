/**
 * RSVP backend for the wedding site (Google Sheets + Apps Script).
 *
 * SETUP (one time):
 *  1. Create a Google Sheet (sheets.new). In row 1 add these headers exactly:
 *        timestamp    email    name    extras    invite_code
 *  2. In that sheet: Extensions -> Apps Script. Delete the sample code and paste THIS file.
 *  3. (Optional) set NOTIFY_EMAIL below to get an email on every RSVP.
 *  4. Deploy -> New deployment -> type "Web app".
 *        Execute as: Me     |     Who has access: Anyone
 *     Deploy, authorize, and copy the Web app URL (ends in /exec).
 *  5. Paste that URL into js/scripts.js where it says PASTE_YOUR_WEB_APP_URL_HERE,
 *     then run `npx gulp` to rebuild.
 *
 * Whenever you edit this script later: Deploy -> Manage deployments -> edit (pencil)
 * -> Version: New version -> Deploy, or the old code keeps serving.
 */

var SHEET_NAME = 'Sheet1';   // the tab name in your spreadsheet
var NOTIFY_EMAIL = 'tariqmbrown@gmail.com';   // emails you on each RSVP; set to '' to disable

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);                       // prevent two RSVPs writing at once
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    var row = headers.map(function (h) {
      if (h === 'timestamp') return new Date();
      return (e.parameter[h] !== undefined) ? e.parameter[h] : '';
    });
    sheet.appendRow(row);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL, 'New wedding RSVP – ' + (e.parameter.name || ''),
        'Name: ' + (e.parameter.name || '') + '\n' +
        'Email: ' + (e.parameter.email || '') + '\n' +
        'Additional guests: ' + (e.parameter.extras || ''));
    }

    return json({ result: 'success', row: row });
  } catch (err) {
    return json({ result: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

// Lets you open the /exec URL in a browser to confirm the deployment is live.
function doGet() {
  return json({ result: 'ok', message: 'RSVP endpoint is live. Submit the form on the website.' });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
