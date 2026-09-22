const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('../index.js'); // Updated path alignment to reference root index.js

// Configure a temporary tracking secret variable for testing execution trust loops
const TEST_PROXY_SECRET = 'test_secret_password_123';
process.env.RAPIDAPI_PROXY_SECRET = TEST_PROXY_SECRET;

const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log('🚀 Test server active on port:', port);
  const boundary = '----TestBoundary123';

  // Base authorized headers mix passed to bypass proxy blockers legally on safe routes
  const validHeaders = {
    'x-rapidapi-proxy-secret': TEST_PROXY_SECRET
  };

  try {
    // --- SECURITY TESTING: Validate Proxy Walls Drop Malicious Traps Natively ---
    console.log('\n--- Running Security Barrier Validation ---');
    
    // Intruder Test A: Key Status without any credentials (Must be Blocked)
    const blockRes1 = await makeRequest(port, '/api/v1/key-status', 'GET', null, {});
    console.log('Security Block 1 (No Key):', blockRes1.statusCode, blockRes1.body);
    assertErrorFormat(blockRes1, 401);

    // Intruder Test B: Parse Document without any credentials (Must be Blocked)
    const blockRes2 = await makeRequest(port, '/api/v1/parse-document', 'POST', null, {});
    console.log('Security Block 2 (No Key Multipart):', blockRes2.statusCode, blockRes2.body);
    assertErrorFormat(blockRes2, 401);


    // --- INTEGRATION TESTING: Validate Normal Core Application Endpoints ---
    console.log('\n--- Running Core Integration Workflows ---');

    // Test 1: No file — should return unified validation error format
    const res1 = await makeRequest(port, '/api/v1/parse-document', 'POST', null, { ...validHeaders });
    console.log('Test 1 (no file):', res1.statusCode, res1.body);
    assertErrorFormat(res1, 400);

    // Test 2: Health
    const res2 = await makeRequest(port, '/api/v1/health', 'GET', null, { ...validHeaders });
    console.log('Test 2 (health):', res2.statusCode, res2.body);

    // Test 3: Key status (no upstream AI keys configured)
    const res2b = await makeRequest(port, '/api/v1/key-status', 'GET', null, { ...validHeaders });
    console.log('Test 2b (key-status):', res2b.statusCode, res2b.body);

    // Test 4: Key status with Authorization header
    const res2c = await makeRequest(port, '/api/v1/key-status', 'GET', null, {
      ...validHeaders,
      'Authorization': 'Bearer AIza-test-google-key',
    });
    console.log('Test 2c (key-status with Google key):', res2c.statusCode, res2c.body);

    // Test 5: Key status with OpenRouter key
    const res2d = await makeRequest(port, '/api/v1/key-status', 'GET', null, {
      ...validHeaders,
      'x-openrouter-key': 'sk-or-v1-test123',
    });
    console.log('Test 2d (key-status with OpenRouter key):', res2d.statusCode, res2d.body);

    // Test 6: Invoice PDF Parsing (Natively inspects byte layouts)
    const invoicePdf = fs.readFileSync(path.join(__dirname, 'fixtures', 'invoice.pdf'));
    const invoiceBody = buildMultipart(boundary, 'document', 'invoice.pdf', 'application/pdf', invoicePdf);
    const res3 = await makeRequest(port, '/api/v1/parse-document', 'POST', invoiceBody, {
      ...validHeaders,
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': Buffer.byteLength(invoiceBody),
    });
    console.log('Test 3 (invoice PDF):', res3.statusCode, res3.body.substring(0, 600));
    assertJsonField(res3, 'document_type', 'invoice');

    // Test 7: Cache hit execution check
    const res4 = await makeRequest(port, '/api/v1/parse-document', 'POST', invoiceBody, {
      ...validHeaders,
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': Buffer.byteLength(invoiceBody),
    });
    console.log('Test 4 (cache hit):', res4.statusCode, res4.body.substring(0, 200));

    // Test 8: Resume PDF Parsing
    const resumePdf = fs.readFileSync(path.join(__dirname, 'fixtures', 'resume.pdf'));
    const resumeBody = buildMultipart(boundary, 'document', 'resume.pdf', 'application/pdf', resumePdf);
    const res5 = await makeRequest(port, '/api/v1/parse-document', 'POST', resumeBody, {
      ...validHeaders,
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': Buffer.byteLength(resumeBody),
    });
    console.log('Test 5 (resume PDF):', res5.statusCode, res5.body.substring(0, 700));
    assertJsonField(res5, 'document_type', 'resume');

    // Test 9: RapidAPI Transaction Headers Logger verification tracking loops
    const res5b = await makeRequest(port, '/api/v1/parse-document', 'POST', invoiceBody, {
      ...validHeaders,
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': Buffer.byteLength(invoiceBody),
      'x-rapidapi-user': 'test-user-123',
      'x-rapidapi-subscription': 'basic-tier-abc-def-12345',
    });
    console.log('Test 5b (RapidAPI headers pass):', res5b.statusCode, res5b.body.substring(0, 200));

    // Test 10: Oversized limit checking (6MB) — should trigger unified 413 error block
    const bigBuf = Buffer.alloc(6 * 1024 * 1024, 0x41);
    const bigBody = buildMultipart(boundary, 'document', 'big.pdf', 'application/pdf', bigBuf);
    const res6 = await makeRequest(port, '/api/v1/parse-document', 'POST', bigBody, {
      ...validHeaders,
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': Buffer.byteLength(bigBody),
    });
    console.log('Test 6 (oversized):', res6.statusCode, res6.body);
    assertErrorFormat(res6, 413);

    // Test 11: Spoofed Non-PDF File (Natively catches byte layout mismatch)
    const txtBody = buildMultipart(boundary, 'document', 'test.txt', 'text/plain', Buffer.from('hello'));
    const res7 = await makeRequest(port, '/api/v1/parse-document', 'POST', txtBody, {
      ...validHeaders,
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': Buffer.byteLength(txtBody),
    });
    console.log('Test 7 (non-PDF structure block):', res7.statusCode, res7.body);
    assertErrorFormat(res7, 400);

    // Test 12: Cache Health
    const res8 = await makeRequest(port, '/api/v1/health', 'GET', null, { ...validHeaders });
    console.log('Test 8 (cache size after total steps):', res8.statusCode, res8.body);

    // Test 13: 404 Routing Exceptions
    const res9 = await makeRequest(port, '/api/v1/nonexistent', 'GET', null, { ...validHeaders });
    console.log('Test 9 (404 parsing error handling):', res9.statusCode, res9.body);
    assertErrorFormat(res9, 404);

    console.log('\n🎉 =====================================');
    console.log('🏆 ALL CORE SYSTEM SECURITY TESTS PASSED');
    console.log('========================================');
    server.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST RUNTIME ENCOUNTERED CRITICAL FAILURES:');
    console.error(error.message);
    server.close();
    process.exit(1);
  }
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
  // Verify no stack traces or file paths leak out to clients
  if (/\/tmp\/|node_modules|\.js:\d+/.test(parsed.error.message)) {
    throw new Error(`Internal file system layout path leaked inside error string: ${parsed.error.message}`);
  }
}

function assertJsonField(res, field, expectedValue) {
  const parsed = JSON.parse(res.body);
  if (parsed[field] !== expectedValue) {
    throw new Error(`Expected ${field}=${expectedValue}, got ${parsed[field]}`);
  }
}
