import typescript from 'rollup-plugin-typescript2';
import p from './package.json';

export default {
  input: 'src/validator.ts',
  output: [
    {
      file: p.module,
      format: 'es'
    },
    {
      file: p.main,
      format: 'cjs'
    }
  ],
  plugins: [
    typescript()
  ],
  external: [
    'ts-custom-error'
  ]
};
