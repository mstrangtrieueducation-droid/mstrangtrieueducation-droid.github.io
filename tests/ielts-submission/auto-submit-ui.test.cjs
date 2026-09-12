const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const lessonDir = path.join(root, 'ielts-nghe');
const pages = fs.readdirSync(lessonDir)
  .filter(name => name.endsWith('.html') && name !== 'index.html');

assert.equal(pages.length, 40, 'all 40 published listening lessons must be checked');

let small = 0;
let large = 0;
const clientNames = new Set();
for (const page of pages) {
  const html = fs.readFileSync(path.join(lessonDir, page), 'utf8');
  assert.doesNotMatch(html, /THỬ GỬI LẠI ĐIỂM|GỬI LẠI KẾT QUẢ|em cũng có thể bấm gửi lại|Em có thể thử gửi lại/,
    `${page} must not ask students to submit a confirmed attempt again`);
  assert.match(html, /em không cần bấm thêm/,
    `${page} must explain that automatic retry needs no extra click`);
  const client = html.match(/submission-client\.([0-9a-f]{12})\.js/);
  assert(client, `${page} must use the content-hashed durable submission client`);
  clientNames.add(client[0]);
  if (html.includes('Đang tự động ghi điểm</h2>')) {
    small++;
    assert.doesNotMatch(html, /onclick="resumeFinalSubmission\(\)"/,
      `${page} must not expose a manual retry action`);
  } else {
    large++;
    assert.match(html, /submission\.status==="error"\)\{button\.disabled=true/,
      `${page} must keep the only submit button disabled after confirmation`);
    assert.match(html, /"ĐANG TỰ GỬI LẠI…"/,
      `${page} must show automatic retry progress`);
  }
}

assert.deepEqual({small, large}, {small: 20, large: 20});
assert.equal(clientNames.size, 1, 'all lessons must use the same submission client');
const clientName = [...clientNames][0];
const client = fs.readFileSync(path.join(lessonDir, clientName), 'utf8');
assert.doesNotMatch(client, /textContent='Kiểm tra lại'/,
  'the durable queue must not ask students for another click');
assert.match(client, /root\.addEventListener\('pageshow',wakePending\)/);
assert.match(client, /root\.addEventListener\('focus',wakePending\)/);
assert.match(client, /root\.addEventListener\('online',wakePending\)/);

console.log(`PASS automatic one-confirmation score flow across ${pages.length} listening lessons`);
