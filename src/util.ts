import color from '@heroku-cli/color'
import cli from 'cli-ux'
import * as execa from 'execa'
import * as fs from 'fs-extra'

export function spawn(command: string, args: string[] = [], opts: execa.Options = {}) {
  const env = { ...(opts.env || {}) }
  if (color.enabled) env.FORCE_COLOR = '1'
  return execa(command, args, {
    stdio: cli.config.mock ? [] : 'inherit',
    env,
    ...opts,
  })
}

export function hasTSLint(): boolean {
  return fs.existsSync('tslint.json')
}

export function hasPrettier(): boolean {
  return fs.existsSync('.prettierrc')
}

export function hasTypescript(): boolean {
  return fs.existsSync('tsconfig.json')
}

export function hasJest(pkg: any): boolean {
  return pkg.devDependencies && pkg.devDependencies.jest
}
