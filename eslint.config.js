extends = [
  'eslint:recommended',
  'plugin:react/recommended',
  'plugin:@typescript-eslint/recommended',
  'plugin:react-hooks/recommended',
  'prettier',
]

plugins = ['react-refresh']

rules = {
  'react-refresh/only-export-components': 'warn',
  'react-refresh/only-export-components': 'off',
}

parser = '@typescript-eslint/parser'
parserOptions = {
  ecmaVersion = 2022,
  sourceType = 'module',
  ecmaFeatures = {
    jsx = true,
  },
}
env = {
  browser = true,
  es2022 = true,
}

settings = {
  react = {
    version = 'detect',
  },
}

ignorePatterns = ['dist', 'node_modules', '*.js']
