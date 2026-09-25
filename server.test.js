require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('./index');

const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log('Test server on port', port);
  const boundary = '----TestBoundary123';

  // Test 1: No file — should return unified error format
  const res1 = await makeRequest(port, '/api/v1/parse-document', 'POST', null, {});
  console.log('\nTest 1 (no file):', res1.statusCode, res1.body);
  assertErrorFormat(res1, 400);

  // Test 2: Health
  const res2 = await makeRequest(port, '/api/v1/health', 'GET', null, {});
  console.log('Test 2 (health):', res2.statusCode, res2.body);

  // Test 3: Key status (no key configured)
  const res2b = await makeRequest(port, '/api/v1/key-status', 'GET', null, {});
  console.log('Test 2b (key-status):', res2b.statusCode, res2b.body);

  // Test 4: Key status with Authorization header
  const res2c = await makeRequest(port, '/api/v1/key-status', 'GET', null, {
    'Authorization': 'Bearer AIza-test-google-key',
  });
  console.log('Test 2c (key-status with Google key):', res2c.statusCode, res2c.body);

  // Test 5: Key status with OpenRouter key
  const res2d = await makeRequest(port, '/api/v1/key-status', 'GET', null, {
    'x-openrouter-key': 'sk-or-v1-test123',
  });
  console.log('Test 2d (key-status with OpenRouter key):', res2d.statusCode, res2d.body);

  // Test 6: Invoice PDF
  const fixturesDir = path.join(__dirname, 'fixtures');
  let invoicePdf = null;
  if (fs.existsSync(path.join(fixturesDir, 'invoice.pdf'))) {
    invoicePdf = fs.readFileSync(path.join(fixturesDir, 'invoice.pdf'));
  } else {
    console.log('Warning: invoice.pdf not found in fixtures directory');
  }

  if (invoicePdf) {
    const invoiceBody = buildMultipart(boundary, 'document', 'invoice.pdf', 'application/pdf', invoicePdf);
    const res3 = await makeRequest(port, '/api/v1/parse-document', 'POST', invoiceBody, {
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': Buffer.byteLength(invoiceBody),
    });
    console.log('Test 3 (invoice PDF):', res3.statusCode, res3.body.substring(0, 600));
    assertJsonField(res3, 'document_type', 'invoice');
    assertJsonField(res3, 'parsed_by', 'rules');

    // Test 7: Cache hit (same invoice)
    const res4 = await makeRequest(port, '/api/v1/parse-document', 'POST', invoiceBody, {
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': Buffer.byteLength(invoiceBody),
    });
    console.log('Test 4 (cache hit):', res4.statusCode, res4.body.substring(0, 200));
  }

  // Test 8: Resume PDF
  let resumePdf = null;
  if (fs.existsSync(path.join(fixturesDir, 'resume.pdf'))) {
    resumePdf = fs.readFileSync(path.join(fixturesDir, 'resume.pdf'));
  } else {
    console.log('Warning: resume.pdf not found in fixtures directory');
  }

  if (resumePdf) {
    const resumeBody = buildMultipart(boundary, 'document', 'resume.pdf', 'application/pdf', resumePdf);
    const res5 = await makeRequest(port, '/api/v1/parse-document', 'POST', resumeBody, {
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': Buffer.byteLength(resumeBody),
    });
    console.log('Test 5 (resume PDF):', res5.statusCode, res5.body.substring(0, 700));
    assertJsonField(res5, 'document_type', 'resume');
  }

  // Test 9: RapidAPI headers (should be logged but not affect parsing)
  if (invoicePdf) {
    const invoiceBody = buildMultipart(boundary, 'document', 'invoice.pdf', 'application/pdf', invoicePdf);
    const res5b = await makeRequest(port, '/api/v1/parse-document', 'POST', invoiceBody, {
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': Buffer.byteLength(invoiceBody),
      'x-rapidapi-user': 'test-user-123',
      'x-rapidapi-subscription': 'basic-tier-abc-def-12345',
    });
    console.log('Test 5b (RapidAPI headers):', res5b.statusCode, res5b.body.substring(0, 200));
  }

  // Test 10: Oversized (6MB) — unified error format
  const bigBuf = Buffer.alloc(6 * 1024 * 1024, 0x41);
  const bigBody = buildMultipart(boundary, 'document', 'big.pdf', 'application/pdf', bigBuf);
  const res6 = await makeRequest(port, '/api/v1/parse-document', 'POST', bigBody, {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': Buffer.byteLength(bigBody),
  });
  console.log('Test 6 (oversized):', res6.statusCode, res6.body);
  assertErrorFormat(res6, 413);

  // Test 11: Non-PDF file — unified error format
  const txtBody = buildMultipart(boundary, 'document', 'test.txt', 'text/plain', Buffer.from('hello'));
  const res7 = await makeRequest(port, '/api/v1/parse-document', 'POST', txtBody, {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': Buffer.byteLength(txtBody),
  });
  console.log('Test 7 (non-PDF):', res7.statusCode, res7.body);
  assertErrorFormat(res7, 400);

  // Test 12: Cache health after all
  const res8 = await makeRequest(port, '/api/v1/health', 'GET', null, {});
  console.log('Test 8 (cache size after):', res8.statusCode, res8.body);

  // Test 13: 404 for unknown API route
  const res9 = await makeRequest(port, '/api/v1/nonexistent', 'GET', null, {});
  console.log('Test 9 (404):', res9.statusCode, res9.body);
  assertErrorFormat(res9, 404);

  // Test 14: Docling status (configured via .env, endpoint may or may not be reachable)
  const res10 = await makeRequest(port, '/api/v1/docling-status', 'GET', null, {});
  console.log('Test 10 (docling-status):', res10.statusCode, res10.body);

  console.log('\n=== All tests passed ===');
  server.close();
  process.exit(0);
});

function makeRequest(port, path, method, body, headers) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: '127.0.0.1', port, path, method, headers };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function buildMultipart(boundary, field, filename, contentType, content) {
  const parts = [
    '--' + boundary + '\r\n',
    'Content-Disposition: form-data; name="' + field + '"; filename="' + filename + '"\r\n',
    'Content-Type: ' + contentType + '\r\n\r\n',
  ];
  const header = Buffer.from(parts.join(''));
  const footer = Buffer.from('\r\n--' + boundary + '--\r\n');
  return Buffer.concat([header, content, footer]);
}

function assertErrorFormat(res, expectedStatus) {
  if (res.statusCode !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${res.statusCode}`);
  }
  const parsed = JSON.parse(res.body);
  if (parsed.success !== false) {
    throw new Error(`Expected success=false in error response, got: ${JSON.stringify(parsed)}`);
  }
  if (!parsed.error || !parsed.error.code || !parsed.error.message) {
    throw new Error(`Error response missing unified format: ${JSON.stringify(parsed)}`);
  }
  // Verify no stack traces or file paths leak
  if (/\/tmp\/|node_modules|\.js:\d+/.test(parsed.error.message)) {
    throw new Error(`Internal path leaked in error message: ${parsed.error.message}`);
  }
}

function assertJsonField(res, field, expectedValue) {
  const parsed = JSON.parse(res.body);
  if (parsed[field] !== expectedValue) {
    throw new Error(`Expected ${field}=${expectedValue}, got ${parsed[field]}`);
  }
}
