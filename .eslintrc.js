module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'airbnb-base'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    indent: ['error', 2, { ArrayExpression: 'first' }],
    'comma-dangle': ['error', 'never'],
    'import/extensions': 'off'
  }
};
