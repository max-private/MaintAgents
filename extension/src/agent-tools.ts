// ISO 14764 type-level tool names (v3.0.0)
export const TOOL_NAMES = [
    'maintenance_corrective',
    'maintenance_adaptive',
    'maintenance_perfective',
    'maintenance_preventive',
    'maintenance_route',
] as const;

export function getAllToolNames(): string[] {
    return [...TOOL_NAMES];
}
