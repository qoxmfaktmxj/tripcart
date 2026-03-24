// ESLint 9 flat config 기반 공유 설정
// 각 앱/패키지의 eslint.config.js 에서 spread 하여 사용
import js from '@eslint/js'

/** @type {import("eslint").Linter.Config[]} */
export const base = [
  js.configs.recommended,
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
]

export default base
