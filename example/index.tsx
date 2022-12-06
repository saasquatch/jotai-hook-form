import { atom, useAtomValue } from 'jotai';
import * as React from 'react';
import 'react-app-polyfill/ie11';
import * as ReactDOM from 'react-dom';
import { createFormAtoms, useFormAtoms } from '../.';

type FormData = {
  email: string;
  password: string;
};

const validateRequiredField = field => {
  if (field.dirty && !field.value) {
    return {
      type: 'required',
      message: `Field is required`,
    };
  }
};

const dataAtom = atom({
  email: 'a@example.com',
  password: 'asdfasdfasdf',
} as FormData);

const formAtoms = createFormAtoms<FormData>({ dataAtom });
// const emailAtom = formAtoms.fieldAtom('/email', {
//   validate: validateRequiredField,
//   controlled: false,
// });

const App = () => {
  // const email = useFieldAtom(emailAtom);

  return (
    <div>
      {/* <div style={{ display: 'flex', flexDirection: 'column' }}>
        <input {...email} />
        <span>Error: {email.error?.message}</span>
        <pre>{JSON.stringify(email)}</pre>
      </div> */}
      <Input name="/email" type="email" />
      <hr />
      <Input name="/password" type="password" />
      <hr />
      <Data />
      <hr />
      <Errors />
    </div>
  );
};

const Data = () => {
  const data = useAtomValue(dataAtom);

  return <pre>{JSON.stringify(data)}</pre>;
};

const Errors = () => {
  const errors = useAtomValue(formAtoms.errorStackAtom);

  return <pre>{JSON.stringify(errors)}</pre>;
};

const Input = ({ name, type }: { name: any; type: any }) => {
  const { useControlledField } = useFormAtoms(formAtoms);
  const field = useControlledField(name, {
    validate: field => {
      if (field.dirty && !field.value) {
        return {
          type: 'required',
          message: `Field is required`,
        };
      }
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
