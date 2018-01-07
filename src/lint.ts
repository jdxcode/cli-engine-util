import color from '@heroku-cli/color'
import * as execa from 'execa'
import _ from 'ts-lodash'

import { hasPrettier, hasTSLint, hasTypescript } from './util'

export type Linter = 'tsc' | 'tslint' | 'prettier'

export interface Options {
  fix?: boolean
}

export type Result = execa.ExecaReturns & { error?: LintError }

export function active(): Linter[] {
  return _.compact([hasTypescript() && 'tsc', hasTSLint() && 'tslint', hasPrettier() && 'prettier'])
}

export const lint: { [k: string]: (opts: Options) => Promise<Result> } = {
  async tsc() {
    const result = await execa('tsc', { reject: false })
    if (isExecaError(result)) return { ...result, error: result }
    return result
  },
  async tslint({ fix }) {
    const args = ['--project', '.']
    if (fix) args.push('--fix')
    const result = await execa('tslint', args, { reject: false })
    if (isExecaError(result)) return { ...result, error: new TSLintError(result) }
    return result
  },

  async prettier({ fix }) {
    const args = ['--list-different', 'src/**/*.ts', 'src/**/*.js']
    if (fix) args[0] = '--write'
    const result: Result = await execa('prettier', args, { reject: false })
    if (isExecaError(result)) return { ...result, error: new PrettierError(result) }
    return result
  },
}

function cmd(): string {
  const script = process.env.npm_lifecycle_event
  if (script && ['precommit', 'test'].includes(script)) {
    return `yarn run ${script}`
  }
  return 'cli-engine-util lint'
}

function combinedOutput(err: execa.ExecaError) {
  return _.compact([err.stdout, err.stderr]).join('\n')
}

export class LintError extends Error {
  constructor(err: execa.ExecaError | string) {
    if (typeof err === 'string') super(err)
    else if ((err.code as any) === 'ENOENT') super(`${err.cmd} command not found. Make sure it is installed.`)
    else return err
  }
}

export class TSLintError extends LintError {
  constructor(err: execa.ExecaError) {
    if (err.code !== 2) super(err)
    else {
      const command = color.cmd(`${cmd()} --fix`)
      super(`Error in tslint:
${combinedOutput(err)}Run ${command} to try to fix issues automatically.`)
    }
  }
}

export class PrettierError extends LintError {
  constructor(err: execa.ExecaError) {
    if (err.code !== 1) super(err)
    else {
      const command = color.cmd(`${cmd()} --fix`)
      super(`Prettier would generate these files differently:

${combinedOutput(err)}
Run ${command} to try to fix issues automatically.`)
    }
  }
}

function isExecaError(r: execa.ExecaReturns): r is execa.ExecaError {
  return r.code !== 0
}
