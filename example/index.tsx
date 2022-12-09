import { atom, useAtomValue } from 'jotai';
import * as React from 'react';
import 'react-app-polyfill/ie11';
import * as ReactDOM from 'react-dom';
import { Conditional, createFormAtoms, useFieldAtom, useFormAtoms } from '../.';

type FormData = {
  email: string;
  password: string;
};

const dataAtom = atom({
  email: 'a@example.com',
  password: 'asdfasdfasdf',
} as FormData);

const formAtoms = createFormAtoms<FormData>({ dataAtom });
const checkAtom = formAtoms.fieldAtom('/checked', {
  validate: field => undefined,
});
// const firstNameAtom = formAtoms.fieldAtom('/firstname');

const App = () => {
  const check = useFieldAtom(checkAtom);
  // const firstname = useFieldAtom(firstNameAtom);
  const { useControlledField, useField } = useFormAtoms(formAtoms);

  const firstname = useControlledField('/firstname');
  const lastname = useControlledField('/lastname');

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <input
          type="checkbox"
          checked={check.value}
          onChange={e => check.onChange(e.target.checked)}
        />
        <pre>{JSON.stringify(check)}</pre>
      </div>

      <Conditional show={check.value} fields={[firstname]}>
        <input
          {...firstname}
          onChange={e => firstname.onChange(e.target.value)}
        />
        <br />
        <input
          {...lastname}
          onChange={e => lastname.onChange(e.target.value)}
        />
      </Conditional>

      {/* <Input name="/email" type="email" />
      <hr />
      <Input name="/password" type="password" /> */}
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
