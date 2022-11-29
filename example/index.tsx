import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { atom, useAtomValue } from 'jotai';
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
  return (
    <div>
      <Input type="email" name="/email" />
      <hr />
      <Input type="password" name="/password" />
    </div>
  );
};

const Input = ({ name, type, validation }: {name: any, type: any, validation?: any}) => {
  const { useControlledField } = useFormAtoms(formAtoms);
  const field = useControlledField(name, {
    validate: (value) => !!value,
    errorMessage: "Field is required"
  });

  return (
    <div style={{display: "flex", flexDirection:"column"}}>
      <input type={type} {...field} onChange={e => field.onChange(e.target.value)} />
      <span>Error: {field.error}</span>
      <pre>{JSON.stringify(field)}</pre>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'));
