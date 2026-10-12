// Automated Test Suite for Dwarkesh Real Estate Autocomplete Search
import assert from 'assert';

const BASE_URL = 'http://127.0.0.1:3000';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAutocomplete(query = '', params = {}) {
  const sp = new URLSearchParams({ q: query, ...params });
  const start = performance.now();
  const res = await fetch(`${BASE_URL}/api/search/suggestions?${sp.toString()}`);
  const duration = performance.now() - start;
  const json = await res.json();
  return {
    status: res.status,
    headers: res.headers,
    data: json,
    durationMs: duration,
  };
}

async function runTests() {
  console.log('🚀 Starting Dwarkesh Database-Driven Search Autocomplete Test Suite...\n');
  const results = [];

  function pass(title, detail = '') {
    console.log(`✅ PASS: ${title} ${detail ? `(${detail})` : ''}`);
    results.push({ title, pass: true });
  }

  function fail(title, error) {
    console.error(`❌ FAIL: ${title} ->`, error);
    results.push({ title, pass: false, error });
  }

  // TEST 1: Single character search ('L')
  try {
    const res = await fetchAutocomplete('L');
    assert.strictEqual(res.status, 200, 'Status should be 200');
    assert.ok(res.data.total > 0, 'Total suggestions should be > 0');
    assert.ok(Array.isArray(res.data.categories), 'Categories should be an array');
    
    // Check categories exist
    const hasLocations = res.data.categories.some((c) => c.id === 'locations');
    const hasProps = res.data.categories.some((c) => c.id === 'properties');
    assert.ok(hasLocations || hasProps, 'Should contain location or property categories for L');
    pass('Single Character Matching ("L")', `${res.data.total} suggestions found in ${res.durationMs.toFixed(1)}ms`);
  } catch (e) {
    fail('Single Character Matching ("L")', e.message);
  }

  // TEST 2: Progressive narrowing on location ('Lud' -> Ludhiana)
  try {
    const res = await fetchAutocomplete('Lud');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.total > 0, 'Should find matching Ludhiana records');

    const locCat = res.data.categories.find((c) => c.id === 'locations');
    assert.ok(locCat, 'Locations category should be present');
    const hasLudhiana = locCat.items.some((item) =>
      item.title.toLowerCase().includes('ludhiana')
    );
    assert.ok(hasLudhiana, 'Locations should contain Ludhiana');

    const propCat = res.data.categories.find((c) => c.id === 'properties');
    assert.ok(propCat, 'Properties category should be present');
    const hasImperial = propCat.items.some((item) =>
      item.title.toLowerCase().includes('imperial')
    );
    assert.ok(hasImperial, 'Properties should contain The Imperial Heights in Ludhiana');
    pass('Progressive Narrowing ("Lud")', `Matched Ludhiana locations & properties in ${res.durationMs.toFixed(1)}ms`);
  } catch (e) {
    fail('Progressive Narrowing ("Lud")', e.message);
  }

  // TEST 3: Attribute configuration matching ('2 BHK')
  try {
    const res = await fetchAutocomplete('2 BHK');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.total > 0, 'Should find 2 BHK records');

    const propCat = res.data.categories.find((c) => c.id === 'properties');
    assert.ok(propCat, 'Properties category should match');
    const matchedProp = propCat.items.find((p) => p.bhk === '2 BHK');
    assert.ok(matchedProp, 'Should match real 2 BHK property');

    const attrCat = res.data.categories.find((c) => c.id === 'attributes');
    assert.ok(attrCat, 'Attributes category should match');
    assert.ok(attrCat.items.some((i) => i.title === '2 BHK'), 'Should contain 2 BHK configuration');
    pass('Attribute & BHK Search ("2 BHK")', `Matched 2 BHK property: ${matchedProp.title}`);
  } catch (e) {
    fail('Attribute & BHK Search ("2 BHK")', e.message);
  }

  // TEST 4: Partial-word matching ('ap' -> Apartment)
  try {
    const res = await fetchAutocomplete('ap');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.total > 0);

    const typesCat = res.data.categories.find((c) => c.id === 'types');
    assert.ok(typesCat, 'Property types category should be present');
    const hasApartment = typesCat.items.some((t) =>
      t.title.toLowerCase().includes('apartment')
    );
    assert.ok(hasApartment, 'Should match Architectural Apartment');
    pass('Partial-Word Matching ("ap")', `Matched property type and apartment listings`);
  } catch (e) {
    fail('Partial-Word Matching ("ap")', e.message);
  }

  // TEST 5: Multiword and incomplete ending ('courtyard vil')
  try {
    const res = await fetchAutocomplete('courtyard vil');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.total > 0);

    const propCat = res.data.categories.find((c) => c.id === 'properties');
    assert.ok(propCat, 'Properties category should be found');
    const hasVilla = propCat.items.some((p) =>
      p.title.toLowerCase().includes('courtyard villa')
    );
    assert.ok(hasVilla, 'Should match The Courtyard Villa for "courtyard vil"');
    pass('Multiword & Incomplete Ending ("courtyard vil")', `Found ${propCat.items[0].title}`);
  } catch (e) {
    fail('Multiword & Incomplete Ending ("courtyard vil")', e.message);
  }

  // TEST 6: Empty query (Initial Focus state)
  try {
    const res = await fetchAutocomplete('');
    assert.strictEqual(res.status, 200);
    assert.ok(res.data.total > 0, 'Empty focus query should return popular DB suggestions');
    assert.ok(res.data.categories.length >= 2, 'Should have multiple category sections');
    pass('Empty Query Focus Suggestions', `Returned ${res.data.total} popular suggestions from real DB`);
  } catch (e) {
    fail('Empty Query Focus Suggestions', e.message);
  }

  // TEST 7: Unmatched query handling ('xyzrandomnonexistent999')
  try {
    const res = await fetchAutocomplete('xyzrandomnonexistent999');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.total, 0, 'Total should be 0');
    assert.strictEqual(res.data.categories.length, 0, 'Categories should be empty');
    pass('Unmatched Query Handling', 'Clean empty state returned (total: 0, categories: [])');
  } catch (e) {
    fail('Unmatched Query Handling', e.message);
  }

  // TEST 8: Rapid keystrokes concurrency simulation
  try {
    const keystrokes = ['M', 'Mu', 'Mum', 'Mumb', 'Mumbai'];
    const promises = keystrokes.map((k) => fetchAutocomplete(k));
    const responses = await Promise.all(promises);

    for (let i = 0; i < responses.length; i++) {
      assert.strictEqual(responses[i].status, 200);
      assert.strictEqual(responses[i].data.query, keystrokes[i].toLowerCase());
    }
    const finalRes = responses[responses.length - 1];
    assert.ok(finalRes.data.categories.some((c) => c.id === 'locations'), 'Final should contain Mumbai location');
    pass('Rapid Typing Concurrency', `${keystrokes.length} simultaneous queries resolved accurately without race conditions`);
  } catch (e) {
    fail('Rapid Typing Concurrency', e.message);
  }

  // TEST 9: Performance Requirement (< 60ms latency)
  try {
    // Warm-up request to establish keep-alive socket and eliminate cold compiler latency
    await fetchAutocomplete('Goa');

    const latencies = [];
    for (let i = 0; i < 5; i++) {
      const res = await fetchAutocomplete('Goa');
      latencies.push(res.durationMs);
    }
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    assert.ok(avgLatency < 60, `Average latency (${avgLatency.toFixed(1)}ms) should be < 60ms`);
    pass('Performance & Latency Benchmark', `Average roundtrip: ${avgLatency.toFixed(1)}ms`);
  } catch (e) {
    fail('Performance & Latency Benchmark', e.message);
  }

  // TEST 10: Cache headers
  try {
    const res = await fetchAutocomplete('Worli');
    const cacheHeader = res.headers.get('cache-control');
    assert.ok(cacheHeader && cacheHeader.includes('s-maxage'), 'Cache-Control header should be configured');
    pass('HTTP Caching Headers', `Cache-Control: ${cacheHeader}`);
  } catch (e) {
    fail('HTTP Caching Headers', e.message);
  }

  console.log('\n==================================================');
  const allPassed = results.every((r) => r.pass);
  const passedCount = results.filter((r) => r.pass).length;
  console.log(`Results: ${passedCount} / ${results.length} tests passed`);
  if (allPassed) {
    console.log('🎉 ALL AUTOCOMPLETE TESTS PASSED SUCCESSFULLY!');
  } else {
    console.error('⚠️ SOME TESTS FAILED');
    process.exit(1);
  }
}

runTests();
