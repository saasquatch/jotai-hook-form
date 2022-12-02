import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { createFormAtoms, useFormAtoms } from '../.';
import { ErrorStack } from '../dist/';
import { atomFamily } from 'jotai/esm/utils/atomFamily';

type FormData = {
  email: string;
  password: string;
};

const dataAtom = atom({
  email: 'a@example.com',
  password: 'password',
} as FormData);
const errorStackAtom = atom([] as ErrorStack);

const formAtoms = createFormAtoms<FormData>({ dataAtom, errorStackAtom });

const App = () => {
  const errorStack = useAtomValue(formAtoms.errorStackAtom);
  return (
    <div>
      <Input type="email" name="/email" />
      <hr />
      <Input type="password" name="/password" />
      <hr />
      <pre>{JSON.stringify(errorStack)}</pre>
    </div>
  );
};

const Input = ({ name, type }: { name: any; type: any }) => {
  const { useControlledField } = useFormAtoms(formAtoms);
  const field = useControlledField(name, {
    validate: field => {
      if (!field.value && field.touched)
        return {
          type: 'required',
          message: 'Field is required',
        };
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <input
        type={type}
        {...field}
        onChange={e => field.onChange(e.target.value)}
      />
      <span>Error: {field.error?.message}</span>
      <pre>{JSON.stringify(field)}</pre>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
