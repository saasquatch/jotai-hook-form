import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { atom, useAtomValue } from 'jotai';
// import { Thing } from '../.';
import { createFormAtoms, useFormAtoms } from '../.';
import type { ErrorStack } from '../dist/';

type FormData = {
  email: string;
  password: string;
};

const dataAtom = atom({email: "a@example.com", password: "password"} as FormData);
const errorStackAtom = atom([] as ErrorStack);

const formAtoms = createFormAtoms<FormData>({ dataAtom, errorStackAtom });

const App = () => {
  const data = useAtomValue(dataAtom);
  const { useControlledField } = useFormAtoms(formAtoms);
  const email = useControlledField('/email');
  const password = useControlledField('/password');

  return (
    <div>
      <input type="email" {...email} onChange={e => email.onChange(e.target.value)} />
      <br />
      <input type="password" {...password} onChange={e => password.onChange(e.target.value)} />
      <hr />
      <pre>{JSON.stringify(data)}</pre>
      <hr />
      <pre>{JSON.stringify(email)}</pre>
      <pre>{JSON.stringify(password)}</pre>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
