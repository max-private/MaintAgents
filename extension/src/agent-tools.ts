// Tool name map: agent markdown ID → MCP tool name
export const AGENT_TOOL_MAP: Record<string, string> = {
    'java-maintenance':       'maintenance_java',
    'dotnet-maintenance':     'maintenance_dotnet',
    'python-maintenance':     'maintenance_python',
    'perl-maintenance':       'maintenance_perl',
    'eclipse-rcp':            'maintenance_eclipse_rcp',
    'webservice-maintenance': 'maintenance_webservice',
    'os-compatibility':       'maintenance_os_compat',
    'vulnerability-fix':      'maintenance_vulnerability',
    'test-fix':               'maintenance_test_fix',
    'sonarqube-fix':          'maintenance_sonarqube',
    'autosar-maintenance':    'maintenance_autosar',
};

export function getAllToolNames(): string[] {
    return Object.values(AGENT_TOOL_MAP);
}
