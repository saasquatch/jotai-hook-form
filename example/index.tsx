import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { atom, useAtomValue } from 'jotai';
// import { Thing } from '../.';
import { createFormAtoms, useFormAtoms } from '../.';
import type { ErrorStack } from '../dist/';

const dataAtom = atom({});
const errorStackAtom = atom([] as ErrorStack);

const formAtoms = createFormAtoms({ dataAtom, errorStackAtom });
const App = () => {
  const data = useAtomValue(dataAtom);
  const { useField } = useFormAtoms(formAtoms);
  const email = useField('/email');
  const password = useField('/password');

  return (
    <div>
      <input type="email" {...email} />
      <br />
      <input type="password" {...password} />
      <hr />
      <pre>{JSON.stringify(data)}</pre>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
