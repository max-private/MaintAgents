const path = require('path');
const { AgentRegistry } = require('../orchestrator/agent-registry');
const { AgentRouter }   = require('../orchestrator/router');

const BASE_DIR = path.join(__dirname, '..', 'extension');

describe('AgentRouter — query routing', () => {
  let registry;
  let router;

  beforeAll(async () => {
    registry = new AgentRegistry(BASE_DIR);
    await registry.initialize();
    router = new AgentRouter(registry);
  });

  // ── Routing correctness ─────────────────────────────────────────────────

  test.each([
    ['my JUnit tests are failing after Spring Boot upgrade',       'test-fix'],
    ['security vulnerability CVE detected in dependencies',        'vulnerability-fix'],
    ['upgrade from Java 8 to Java 17',                            'java-maintenance'],
    ['SonarQube code smells and quality gate failures',           'sonarqube-fix'],
    ['REST API migration from SOAP to Spring Boot microservice',  'webservice-maintenance'],
    ['Windows path compatibility issue with native JNI libraries','os-compatibility'],
    ['Eclipse RCP plugin Tycho OSGi bundle upgrade',              'eclipse-rcp'],
  ])('"%s" → top agent is %s', (query, expectedId) => {
    const results = router.selectAgentsForQuery(query, 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].agent.id).toBe(expectedId);
  });

  // ── Score caps & integrity ──────────────────────────────────────────────

  test('no agent score exceeds 140', () => {
    const results = router.selectAgentsForQuery('java spring security sonarqube test vulnerability', 7);
    results.forEach(r => expect(r.score).toBeLessThanOrEqual(140));
  });

  test('score equals sum of scoreBreakdown components (clamped to 0)', () => {
    const results = router.selectAgentsForQuery('CVE security vulnerability dependency scan', 3);
    expect(results.length).toBeGreaterThan(0);
    const top = results[0];
    const rawSum = Object.values(top.scoreBreakdown).reduce((a, b) => a + b, 0);
    expect(top.score).toBe(Math.max(0, rawSum));
  });

  test('critical-risk agents receive -5 riskScore', () => {
    const results = router.selectAgentsForQuery('CVE vulnerability security critical', 7);
    const vulnResult = results.find(r => r.agent.id === 'vulnerability-fix');
    expect(vulnResult).toBeDefined();
    expect(vulnResult.scoreBreakdown.riskScore).toBe(-5);
  });

  test('high-risk agents receive -2 riskScore', () => {
    // os-compatibility has high risk
    const results = router.selectAgentsForQuery(
      'windows linux os path compatibility native jni', 7
    );
    const osResult = results.find(r => r.agent.id === 'os-compatibility');
    expect(osResult).toBeDefined();
    expect(osResult.scoreBreakdown.riskScore).toBe(-2);
  });

  test('low-risk agents receive 0 riskScore', () => {
    const results = router.selectAgentsForQuery('junit test failure spring', 7);
    const testResult = results.find(r => r.agent.id === 'test-fix');
    expect(testResult).toBeDefined();
    expect(testResult.scoreBreakdown.riskScore).toBe(0);
  });

  // ── maxAgents limit ─────────────────────────────────────────────────────

  test('maxAgents=1 returns exactly 1 result', () => {
    const results = router.selectAgentsForQuery('java spring security', 1);
    expect(results.length).toBeLessThanOrEqual(1);
  });

  test('maxAgents=2 returns at most 2 results', () => {
    const results = router.selectAgentsForQuery('java maven spring junit test', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  test('default maxAgents (3) returns at most 3 results', () => {
    const results = router.selectAgentsForQuery('java spring test security sonarqube eclipse');
    expect(results.length).toBeLessThanOrEqual(3);
  });

  // ── Sorting ─────────────────────────────────────────────────────────────

  test('results are sorted descending by score', () => {
    const results = router.selectAgentsForQuery('java spring security test sonarqube', 7);
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
    }
  });

  test('all returned scores are positive', () => {
    const results = router.selectAgentsForQuery('java maven spring security', 7);
    results.forEach(r => expect(r.score).toBeGreaterThan(0));
  });

  // ── Edge cases ──────────────────────────────────────────────────────────

  test('empty query returns no agents', () => {
    expect(router.selectAgentsForQuery('')).toHaveLength(0);
  });

  test('whitespace-only query returns no agents', () => {
    expect(router.selectAgentsForQuery('   ')).toHaveLength(0);
  });

  test('gibberish query returns no agents', () => {
    expect(router.selectAgentsForQuery('xyzzy blorp frobnicator quux')).toHaveLength(0);
  });

  // ── matchedTriggers / matchedCapabilities ───────────────────────────────

  test('CVE query populates matchedTriggers for vulnerability-fix', () => {
    const results = router.selectAgentsForQuery('CVE vulnerability detected', 3);
    const vulnResult = results.find(r => r.agent.id === 'vulnerability-fix');
    expect(vulnResult).toBeDefined();
    expect(vulnResult.matchedTriggers.length).toBeGreaterThan(0);
  });

  test('SonarQube query populates matchedCapabilities', () => {
    const results = router.selectAgentsForQuery('SonarQube code quality gate', 3);
    const sqResult = results.find(r => r.agent.id === 'sonarqube-fix');
    expect(sqResult).toBeDefined();
    expect(sqResult.matchedCapabilities.length).toBeGreaterThan(0);
  });

  // ── getAgentsByKeywordTrigger ────────────────────────────────────────────

  test('getAgentsByKeywordTrigger("cve") returns vulnerability-fix', () => {
    const results = router.getAgentsByKeywordTrigger('cve');
    expect(results.map(a => a.id)).toContain('vulnerability-fix');
  });

  test('getAgentsByKeywordTrigger("unknown_zxq") returns empty array', () => {
    expect(router.getAgentsByKeywordTrigger('unknown_zxq')).toHaveLength(0);
  });

  // ── getAgentsByRiskLevelPreference ──────────────────────────────────────

  test('getAgentsByRiskLevelPreference() puts low-risk agents first', () => {
    const sorted = router.getAgentsByRiskLevelPreference();
    expect(sorted[0].risk_level).not.toBe('critical');
    expect(sorted[sorted.length - 1].risk_level).toBe('critical');
  });

  test('getAgentsByRiskLevelPreference() returns all agents', () => {
    expect(router.getAgentsByRiskLevelPreference().length).toBe(7);
  });
});
