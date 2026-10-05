require('dotenv').config();
const crypto = require('crypto');
const http = require('http');

const seedAdminEmail = process.env.SEED_ADMIN_EMAIL;
const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD;
if (!seedAdminEmail || !seedAdminPassword) {
  console.error('Missing required test environment variables: SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD');
  process.exit(1);
}

const temporaryPassword = crypto.randomBytes(24).toString('hex');

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:5000${path}`);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING CRM API TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${name}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await request('GET', '/health');
    assert(health.status === 200 && health.data.status === 'ok', 'GET /health returns 200 ok');

    // 2. Auth - Login with seeded admin
    const loginRes = await request('POST', '/api/auth/login', {
      email: seedAdminEmail,
      password: seedAdminPassword,
    });
    assert(loginRes.status === 200 && loginRes.data.token, 'POST /api/auth/login succeeds with token');
    const token = loginRes.data.token;

    // 3. Auth - Invalid login
    const badLogin = await request('POST', '/api/auth/login', {
      email: seedAdminEmail,
      password: `${temporaryPassword}-invalid`,
    });
    assert(badLogin.status === 401, 'POST /api/auth/login with wrong password returns 401');

    // 4. Auth - Anonymous account creation is forbidden
    const anonymousRegister = await request('POST', '/api/auth/register', {
      name: 'Unauthorized Agent',
      email: `unauthorized_${Date.now()}@example.com`,
      password: temporaryPassword,
      role: 'ADMIN',
    });
    assert(anonymousRegister.status === 401, 'POST /api/auth/register requires an admin token');

    // 5. Auth - Admin creates a new user
    const testEmail = `testuser_${Date.now()}@example.com`;
    const regRes = await request('POST', '/api/auth/register', {
      name: 'Test Agent',
      email: testEmail,
      password: temporaryPassword,
      role: 'AGENT',
    }, token);
    assert(regRes.status === 201 && regRes.data.user?.role === 'AGENT' && !regRes.data.token, 'POST /api/auth/register creates an agent without authenticating it');

    // 6. Auth - Register duplicate email
    const dupRes = await request('POST', '/api/auth/register', {
      name: 'Dup Agent',
      email: testEmail,
      password: temporaryPassword,
    }, token);
    assert(dupRes.status === 409, 'POST /api/auth/register duplicate email returns 409');

    // 6. Auth - GET /api/auth/me
    const meRes = await request('GET', '/api/auth/me', null, token);
    assert(meRes.status === 200 && meRes.data.user.email === seedAdminEmail, 'GET /api/auth/me returns current user');

    // 7. Users - GET /api/users
    const usersRes = await request('GET', '/api/users', null, token);
    assert(usersRes.status === 200 && Array.isArray(usersRes.data.users) && usersRes.data.users.length >= 2, 'GET /api/users lists users for assignment');

    // 8. Leads - GET /api/leads/dashboard
    const dashRes = await request('GET', '/api/leads/dashboard', null, token);
    assert(
      dashRes.status === 200 &&
      dashRes.data.stats &&
      dashRes.data.stats.total >= 5 &&
      dashRes.data.stats.conversionRate !== undefined,
      'GET /api/leads/dashboard returns statistics'
    );

    // 9. Leads - POST /api/leads
    const newLead = await request(
      'POST',
      '/api/leads',
      {
        name: 'Karan Mehra',
        phone: '+91-9988776655',
        email: 'karan@example.com',
        budget: 6500000,
        location: 'Gurgaon',
        propertyType: '3BHK Flat',
        dealType: 'Buy',
        leadSource: 'Google Ads',
        status: 'New',
        assignedToId: usersRes.data.users[0].id,
        notes: 'Interested in Golf Course Road properties',
        followupDate: new Date('2026-10-10T11:00:00Z').toISOString(),
      },
      token
    );
    assert(newLead.status === 201 && newLead.data.lead && newLead.data.lead.name === 'Karan Mehra', 'POST /api/leads creates lead');
    const createdLeadId = newLead.data.lead.id;

    // 10. Leads - GET /api/leads (Pagination + metadata)
    const listRes = await request('GET', '/api/leads?page=1&limit=5', null, token);
    assert(
      listRes.status === 200 &&
      Array.isArray(listRes.data.leads) &&
      listRes.data.pagination &&
      listRes.data.pagination.totalPages >= 1,
      'GET /api/leads returns paginated list with metadata'
    );

    // 11. Leads - GET /api/leads?search=Karan
    const searchRes = await request('GET', '/api/leads?search=Karan', null, token);
    assert(
      searchRes.status === 200 &&
      searchRes.data.leads.some((l) => l.name.includes('Karan')),
      'GET /api/leads?search=Karan searches leads'
    );

    // 12. Leads - GET /api/leads?status=New
    const filterRes = await request('GET', '/api/leads?status=New', null, token);
    assert(
      filterRes.status === 200 &&
      filterRes.data.leads.every((l) => l.status === 'New'),
      'GET /api/leads?status=New filters by status'
    );

    // 13. Leads - GET /api/leads/:id
    const getOneRes = await request('GET', `/api/leads/${createdLeadId}`, null, token);
    assert(getOneRes.status === 200 && getOneRes.data.lead.id === createdLeadId, 'GET /api/leads/:id retrieves single lead');

    // 14. Leads - PUT /api/leads/:id
    const updateRes = await request(
      'PUT',
      `/api/leads/${createdLeadId}`,
      {
        status: 'Contacted',
        notes: 'First call completed - client interested',
      },
      token
    );
    assert(
      updateRes.status === 200 && updateRes.data.lead.status === 'Contacted',
      'PUT /api/leads/:id updates lead status and notes'
    );

    // 15. Follow-ups - POST /api/followups/lead/:leadId
    const fuRes = await request(
      'POST',
      `/api/followups/lead/${createdLeadId}`,
      {
        title: 'Virtual property tour',
        date: new Date('2026-10-12T15:00:00Z').toISOString(),
        notes: 'Schedule Google Meet for 3D walkthrough',
        status: 'Pending',
      },
      token
    );
    assert(
      fuRes.status === 201 && fuRes.data.followUp && fuRes.data.followUp.title === 'Virtual property tour',
      'POST /api/followups/lead/:leadId schedules follow-up'
    );
    const fuId = fuRes.data.followUp.id;

    // 16. Follow-ups - GET /api/followups/lead/:leadId
    const getFuLeadRes = await request('GET', `/api/followups/lead/${createdLeadId}`, null, token);
    assert(
      getFuLeadRes.status === 200 && Array.isArray(getFuLeadRes.data.followUps) && getFuLeadRes.data.followUps.length >= 1,
      'GET /api/followups/lead/:leadId returns lead follow-ups'
    );

    // 17. Follow-ups - GET /api/followups
    const getAllFuRes = await request('GET', '/api/followups', null, token);
    assert(
      getAllFuRes.status === 200 && Array.isArray(getAllFuRes.data.followUps) && getAllFuRes.data.followUps.length >= 1,
      'GET /api/followups returns all follow-ups'
    );

    // 18. Follow-ups - PUT /api/followups/:id
    const updateFuRes = await request(
      'PUT',
      `/api/followups/${fuId}`,
      {
        title: 'Virtual property tour - completed',
        date: new Date('2026-10-12T15:00:00Z').toISOString(),
        status: 'Done',
      },
      token
    );
    assert(
      updateFuRes.status === 200 && updateFuRes.data.followUp.status === 'Done',
      'PUT /api/followups/:id marks follow-up as Done'
    );

    // 19. Follow-ups - DELETE /api/followups/:id
    const delFuRes = await request('DELETE', `/api/followups/${fuId}`, null, token);
    assert(delFuRes.status === 200, 'DELETE /api/followups/:id deletes follow-up');

    // 20. Leads - DELETE /api/leads/:id
    const delLeadRes = await request('DELETE', `/api/leads/${createdLeadId}`, null, token);
    assert(delLeadRes.status === 200, 'DELETE /api/leads/:id deletes lead');

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed out of ${passed + failed}`);
    console.log(`========================================\n`);

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
