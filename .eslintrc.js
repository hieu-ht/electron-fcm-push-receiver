module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"],
  rules: {
    "import/no-extraneous-dependencies": 0,
    "import/extensions": 0,
    "import/no-unresolved": 0,
    "react/jsx-filename-extension": 0,
    "no-use-before-define": 0,
    "global-require": 0,
    "no-unused-expressions": 0,
    "react/require-default-props": 0,
    "react/no-array-index-key": 0,
    "no-console": 0,
    curly: "error",
    eqeqeq: ["error", "always"],
  },
  overrides: [],
};
