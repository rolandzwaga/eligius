module.exports = {
  extends: ['prettier/@typescript-eslint', 'plugin:prettier/recommended'],
  rules: {
    // note you must disable the base rule as it can report incorrect errors
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {'ignore-pattern': '^_'}],
  },
};
