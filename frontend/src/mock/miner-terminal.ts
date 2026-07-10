export type TerminalLogType = 'net' | 'core' | 'success'

export function generateTerminalLog(): { type: TerminalLogType; msg: string } {
  const types: TerminalLogType[] = ['net', 'core', 'net', 'success']
  const type = types[Math.floor(Math.random() * types.length)]
  const job = Math.random().toString(16).slice(2, 14)
  const speed = (480 + 40 * Math.random()).toFixed(2)
  const msgs: Record<TerminalLogType, string[]> = {
    net: [
      `SHA-256 | New job ${job}, diff=0.${Math.floor(90_000 * Math.random())}`,
      `Share accepted (${Math.floor(50 + 100 * Math.random())}ms)`,
    ],
    core: [`Device speed: ${speed} H/s power: ${(2000 + 300 * Math.random()).toFixed(0)} W`],
    success: [`Block found! Height: ${Math.floor(800_000 + 10_000 * Math.random())}`],
  }
  return { type, msg: msgs[type][Math.floor(Math.random() * msgs[type].length)] }
}
