declare module 'js-yaml' {
  export function load(input: string, options?: object): unknown;
  export function dump(obj: unknown, options?: object): string;
}
