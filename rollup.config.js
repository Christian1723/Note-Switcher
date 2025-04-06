import typescript from '@rollup/plugin-typescript';

export default {
  input: 'main.ts',
  output: {
    dir: '.',
    format: 'cjs'
  },
  plugins: [typescript()]
};
