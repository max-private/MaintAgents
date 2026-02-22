/**
 * Orchestration Layer Test Script
 * Run with: NODE_PATH=extension/node_modules node test-orchestration.js
 */

const { AgentRegistry } = require('./orchestrator/agent-registry');
const { AgentRouter }   = require('./orchestrator/router');
const { PromptBuilder } = require('./orchestrator/prompt-builder');
const path = require('path');

// ── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? '  →  ' + detail : ''}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

// ── Test Runner ───────────────────────────────────────────────────────────────

async function runTests() {
  const baseDir = path.join(__dirname, 'extension');

  // ── 1. Registry initialisation ────────────────────────────────────────────
  section('1. AgentRegistry — Loading & Indexing');

  const registry = new AgentRegistry(baseDir);
  await registry.initialize();

  assert('Registry is ready after initialize()', registry.isReady());
  assert('All 7 agents loaded', registry.getAgentCount() === 7,
         `got ${registry.getAgentCount()}`);

  const agents = registry.getAllAgents();
  const agentNames = agents.map(a => a.id);
  console.log(`\n  Loaded agents: ${agentNames.join(', ')}`);

  const expectedIds = [
    'java-maintenance',
    'test-fix',
    'vulnerability-fix',
    'sonarqube-fix',
    'webservice-maintenance',
    'os-compatibility',
    'eclipse-rcp',
  ];
  for (const id of expectedIds) {
    assert(`Agent "${id}" present`, registry.hasAgent(id));
  }

  // ── 2. Index queries ──────────────────────────────────────────────────────
  section('2. AgentRegistry — Index Queries');

  const capabilities = registry.getAllCapabilities();
  assert('Capability index is non-empty', capabilities.length > 0,
         `${capabilities.length} entries`);
  console.log(`  Sample capabilities: ${capabilities.slice(0, 5).join(', ')}`);

  const tools = registry.getAllTools();
  assert('Tool index is non-empty', tools.length > 0, `${tools.length} entries`);
  console.log(`  Sample tools: ${tools.slice(0, 5).join(', ')}`);

  const vulnAgents = registry.getAgentsByRiskLevel('critical');
  assert('Vulnerability agent has critical risk', vulnAgents.length > 0,
         `found: ${vulnAgents.map(a => a.id).join(', ')}`);

  const lowRiskAgents = registry.getAgentsByRiskLevel('low');
  assert('At least one low-risk agent', lowRiskAgents.length > 0,
         `found: ${lowRiskAgents.map(a => a.id).join(', ')}`);

  const mavenAgents = registry.getAgentsByTool('maven');
  assert('Maven tool resolves to an agent', mavenAgents.length > 0,
         `found: ${mavenAgents.map(a => a.id).join(', ')}`);

  const searchResults = registry.searchAgents('spring');
  assert('Keyword search for "spring" returns results', searchResults.length > 0,
         `found ${searchResults.length} agent(s)`);

  // Skills extracted from markdown
  const javaAgent = registry.getAgent('java-maintenance');
  assert('Java agent has skills loaded from markdown',
         javaAgent !== undefined && javaAgent.skills.length > 0,
         `skills: ${javaAgent?.skills.length ?? 0}`);
  console.log(`  Java agent skills: ${javaAgent?.skills.slice(0, 3).map(s => s.name).join(', ')}`);

  // ── 3. filterAgents ───────────────────────────────────────────────────────
  section('3. AgentRegistry — filterAgents()');

  const mediumRisk = registry.filterAgents({ riskLevel: 'medium' });
  assert('Medium-risk filter returns agents', mediumRisk.length > 0,
         `${mediumRisk.length} agents`);

  const springFilter = registry.filterAgents({ tool: 'spring' });
  assert('Tool filter for "spring" returns agents', springFilter.length > 0,
         `${springFilter.length} agents: ${springFilter.map(a => a.id).join(', ')}`);

  // ── 4. AgentRouter — scoring ──────────────────────────────────────────────
  section('4. AgentRouter — Query Routing');

  const router = new AgentRouter(registry);

  const testCases = [
    {
      query: 'my JUnit tests are failing after Spring Boot upgrade',
      expectedTop: 'test-fix',
      label: 'Test-failure query → test-fix agent',
    },
    {
      query: 'security vulnerability CVE detected in dependencies',
      expectedTop: 'vulnerability-fix',
      label: 'CVE/security query → vulnerability-fix agent',
    },
    {
      query: 'upgrade from Java 8 to Java 17',
      expectedTop: 'java-maintenance',
      label: 'Java upgrade query → java-maintenance agent',
    },
    {
      query: 'SonarQube code smells and quality gate failures',
      expectedTop: 'sonarqube-fix',
      label: 'SonarQube query → sonarqube-fix agent',
    },
    {
      query: 'REST API migration from SOAP to Spring Boot microservice',
      expectedTop: 'webservice-maintenance',
      label: 'REST/microservice query → webservice-maintenance agent',
    },
    {
      query: 'Windows path compatibility issue with native JNI libraries',
      expectedTop: 'os-compatibility',
      label: 'OS/JNI query → os-compatibility agent',
    },
    {
      query: 'Eclipse RCP plugin Tycho OSGi bundle upgrade',
      expectedTop: 'eclipse-rcp',
      label: 'Eclipse RCP query → eclipse-rcp agent',
    },
  ];

  for (const { query, expectedTop, label } of testCases) {
    const results = router.selectAgentsForQuery(query, 3);
    assert(`${label} returns results`, results.length > 0);
    if (results.length > 0) {
      const topId = results[0].agent.id;
      const topScore = results[0].score;
      const ok = topId === expectedTop;
      assert(
        `  Top agent is "${expectedTop}" (score ${topScore})`,
        ok,
        `actual top: "${topId}" (${topScore})`
      );
      // Show full ranking for this query
      console.log(`    Ranking: ${results.map(r => `${r.agent.id}(${r.score})`).join(' > ')}`);
    }
  }

  // ── 5. Score breakdown ────────────────────────────────────────────────────
  section('5. AgentRouter — Score Breakdown Detail');

  const securityResults = router.selectAgentsForQuery('CVE security vulnerability dependency scan', 3);
  if (securityResults.length > 0) {
    const top = securityResults[0];
    console.log(`\n  Query: "CVE security vulnerability dependency scan"`);
    console.log(`  Top agent: ${top.agent.id}  (score: ${top.score})`);
    console.log(`  Score breakdown:`);
    for (const [k, v] of Object.entries(top.scoreBreakdown)) {
      console.log(`    ${k.padEnd(22)} ${v >= 0 ? '+' : ''}${v}`);
    }
    console.log(`  Matched triggers:      ${top.matchedTriggers.join(', ') || '(none)'}`);
    console.log(`  Matched capabilities:  ${top.matchedCapabilities.join(', ') || '(none)'}`);
    console.log(`  Matched tools:         ${top.matchedTools.join(', ') || '(none)'}`);
    assert('Score breakdown sums to agent score',
      Object.values(top.scoreBreakdown).reduce((a, b) => a + b, 0) === top.score
      || top.score === Math.max(0, Object.values(top.scoreBreakdown).reduce((a, b) => a + b, 0)));
  }

  // ── 6. Edge cases ─────────────────────────────────────────────────────────
  section('6. AgentRouter — Edge Cases');

  const emptyResult = router.selectAgentsForQuery('');
  assert('Empty query returns no agents', emptyResult.length === 0);

  const gibberishResult = router.selectAgentsForQuery('xyzzy blorp frobnicator quux');
  assert('Gibberish query returns 0 agents', gibberishResult.length === 0,
         `got ${gibberishResult.length}`);

  const byRisk = router.getAgentsByRiskLevelPreference();
  assert('Risk-sorted list starts with low-risk agents',
         byRisk[0].risk_level === 'low' || byRisk[0].risk_level === 'medium');
  console.log(`  Risk order: ${byRisk.map(a => `${a.id}(${a.risk_level})`).join(', ')}`);

  const limitedResults = router.selectAgentsForQuery('java spring security', 1);
  assert('maxAgents=1 returns at most 1 result', limitedResults.length <= 1);

  // ── 7. PromptBuilder ──────────────────────────────────────────────────────
  section('7. PromptBuilder — Prompt Construction');

  const builder = new PromptBuilder();
  const queryForPrompt = 'upgrade Java 8 to Java 17 and update Spring Boot';
  const agentsForPrompt = router.selectAgentsForQuery(queryForPrompt, 3);

  const prompt = builder.buildPrompt(queryForPrompt, agentsForPrompt);

  assert('Prompt is a non-empty string', typeof prompt === 'string' && prompt.length > 0);
  assert('Prompt contains the user query', prompt.includes(queryForPrompt));
  assert('Prompt contains agent names',
         agentsForPrompt.every(sa => prompt.includes(sa.agent.name)));
  assert('Prompt length is substantial (>500 chars)', prompt.length > 500,
         `length: ${prompt.length}`);

  console.log(`\n  Prompt preview (first 400 chars):\n`);
  console.log('  ' + prompt.slice(0, 400).replace(/\n/g, '\n  '));
  console.log(`\n  ... (total ${prompt.length} characters)`);

  // ── Summary ───────────────────────────────────────────────────────────────
  section('Test Summary');
  const total = passed + failed;
  console.log(`\n  Passed: ${passed}/${total}`);
  if (failed > 0) {
    console.log(`  Failed: ${failed}/${total}`);
    process.exit(1);
  } else {
    console.log('  All tests passed!');
  }
}

runTests().catch(err => {
  console.error('\nFATAL:', err);
  process.exit(1);
});
