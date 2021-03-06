import * as execa from 'execa'
import _ from 'ts-lodash'

import { hasCommitlint, hasPrettier, hasTSLint } from './util'

export type Linter = 'yarn' | 'tsc' | 'tslint' | 'prettier' | 'commitlint'

export interface Options {
  fix?: boolean
}

export type Result = execa.ExecaReturns & { error?: Error }

export default function(opts: Options): string[] {
  return _.compact(['tsc', hasTSLint() && 'tslint', hasPrettier() && 'prettier', hasCommitlint() && 'commitlint']).map(
    l => _lint[l](opts),
  )
}

const _lint: { [k: string]: (opts: Options) => string } = {
  yarn() {
    return 'yarn check'
  },
  tsc() {
    return 'tsc'
  },
  tslint({ fix }) {
    return `tslint${fix ? ' --fix' : ''} --project .`
  },
  prettier({ fix }) {
    return `prettier ${fix ? '--write' : '--list-different'} src/**/*.ts src/**/*.js`
  },
  commitlint() {
    return 'commitlint --from master'
  },
}
