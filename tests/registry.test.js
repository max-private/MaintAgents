const path = require('path');
const { AgentRegistry } = require('../orchestrator/agent-registry');

const BASE_DIR = path.join(__dirname, '..', 'extension');

describe('AgentRegistry — loading & indexing', () => {
  let registry;

  beforeAll(async () => {
    registry = new AgentRegistry(BASE_DIR);
    await registry.initialize();
  });

  // ── Initialisation ──────────────────────────────────────────────────────

  test('isReady() returns true after initialize()', () => {
    expect(registry.isReady()).toBe(true);
  });

  test('calling initialize() twice is idempotent', async () => {
    await registry.initialize(); // second call — should not reload
    expect(registry.getAgentCount()).toBe(10);
  });

  test('all 8 agents are loaded', () => {
    expect(registry.getAgentCount()).toBe(10);
  });

  test.each([
    'java-maintenance',
    'test-fix',
    'vulnerability-fix',
    'sonarqube-fix',
    'webservice-maintenance',
    'os-compatibility',
    'eclipse-rcp',
    'dotnet-maintenance',
    'python-maintenance',
    'perl-maintenance',
  ])('agent "%s" is present', (id) => {
    expect(registry.hasAgent(id)).toBe(true);
  });

  // ── Agent fields ────────────────────────────────────────────────────────

  test('every agent has a non-empty name', () => {
    registry.getAllAgents().forEach(a => expect(a.name).toBeTruthy());
  });

  test('every agent has at least one capability', () => {
    registry.getAllAgents().forEach(a => expect(a.capabilities.length).toBeGreaterThan(0));
  });

  test('every agent has a risk_level', () => {
    const valid = ['low', 'medium', 'high', 'critical'];
    registry.getAllAgents().forEach(a => expect(valid).toContain(a.risk_level));
  });

  test('vulnerability-fix has critical risk and requires_review=true', () => {
    const agent = registry.getAgent('vulnerability-fix');
    expect(agent.risk_level).toBe('critical');
    expect(agent.requires_review).toBe(true);
  });

  test('test-fix has low risk', () => {
    expect(registry.getAgent('test-fix').risk_level).toBe('low');
  });

  test('capabilities are stored in lower-case', () => {
    registry.getAllAgents().forEach(a =>
      a.capabilities.forEach(c => expect(c).toBe(c.toLowerCase()))
    );
  });

  // ── Type inference ──────────────────────────────────────────────────────

  test.each([
    ['vulnerability-fix',      'security'],
    ['test-fix',               'testing'],
    ['sonarqube-fix',          'quality'],
    ['os-compatibility',       'compatibility'],
    ['java-maintenance',       'maintenance'],
    ['eclipse-rcp',            'maintenance'],
    ['webservice-maintenance', 'maintenance'],
    ['dotnet-maintenance',     'maintenance'],
    ['python-maintenance',     'maintenance'],
    ['perl-maintenance',       'maintenance'],
  ])('agent "%s" has inferred type "%s"', (id, expectedType) => {
    expect(registry.getAgent(id).type).toBe(expectedType);
  });

  // ── Skills extraction ───────────────────────────────────────────────────

  test('java-maintenance has skills extracted from markdown', () => {
    const agent = registry.getAgent('java-maintenance');
    expect(agent.skills.length).toBeGreaterThan(0);
  });

  test('each skill has a name and keywords array', () => {
    registry.getAllAgents().forEach(agent =>
      agent.skills.forEach(skill => {
        expect(typeof skill.name).toBe('string');
        expect(Array.isArray(skill.keywords)).toBe(true);
      })
    );
  });

  // ── Index queries ───────────────────────────────────────────────────────

  test('capability index is non-empty', () => {
    expect(registry.getAllCapabilities().length).toBeGreaterThan(0);
  });

  test('tool index is non-empty', () => {
    expect(registry.getAllTools().length).toBeGreaterThan(0);
  });

  test('getAgentsByRiskLevel("critical") returns vulnerability-fix', () => {
    const ids = registry.getAgentsByRiskLevel('critical').map(a => a.id);
    expect(ids).toContain('vulnerability-fix');
  });

  test('getAgentsByRiskLevel("low") returns test-fix', () => {
    const ids = registry.getAgentsByRiskLevel('low').map(a => a.id);
    expect(ids).toContain('test-fix');
  });

  test('getAgentsByTool("maven") returns at least one agent', () => {
    expect(registry.getAgentsByTool('maven').length).toBeGreaterThan(0);
  });

  test('getAgentsByCapability with known capability returns the right agent', () => {
    const javaAgent = registry.getAgent('java-maintenance');
    const cap = javaAgent.capabilities[0];
    const found = registry.getAgentsByCapability(cap);
    expect(found.map(a => a.id)).toContain('java-maintenance');
  });

  test('searchAgents("spring") returns results', () => {
    expect(registry.searchAgents('spring').length).toBeGreaterThan(0);
  });

  test('searchAgents("nonexistent_zxqwerty") returns empty', () => {
    expect(registry.searchAgents('nonexistent_zxqwerty').length).toBe(0);
  });

  // ── filterAgents ────────────────────────────────────────────────────────

  test('filterAgents({riskLevel:"medium"}) returns only medium-risk agents', () => {
    const results = registry.filterAgents({ riskLevel: 'medium' });
    expect(results.length).toBeGreaterThan(0);
    results.forEach(a => expect(a.risk_level).toBe('medium'));
  });

  test('filterAgents({tool:"spring"}) returns webservice or java agents', () => {
    const results = registry.filterAgents({ tool: 'spring' });
    expect(results.length).toBeGreaterThan(0);
  });

  test('filterAgents with unknown riskLevel returns empty', () => {
    expect(registry.filterAgents({ riskLevel: 'nonexistent' }).length).toBe(0);
  });

  // ── getAgent edge cases ─────────────────────────────────────────────────

  test('getAgent with unknown id returns undefined', () => {
    expect(registry.getAgent('nonexistent-agent')).toBeUndefined();
  });

  test('getAllAgents() returns a new array each call (no mutation risk)', () => {
    const first = registry.getAllAgents();
    const second = registry.getAllAgents();
    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });
});

describe('AgentRegistry — missing directory graceful handling', () => {
  test('initializing with non-existent baseDir resolves with 0 agents', async () => {
    const r = new AgentRegistry('/nonexistent/path');
    await expect(r.initialize()).resolves.toBeUndefined();
    expect(r.getAgentCount()).toBe(0);
    expect(r.isReady()).toBe(true);
  });
});
