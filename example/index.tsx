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
const checkAtom = formAtoms.fieldAtom('/checked');
const firstNameAtom = formAtoms.fieldAtom('/firstname', {
  validate: field => {
    if (!field.value && field.touched) {
      return {
        type: 'required',
        message: 'First name is required',
      };
    }

    if (!field.value.startsWith('test_') && field.touched) {
      return {
        type: 'required',
        message: 'First name must start with "test_"',
      };
    }
  },
  type: 'controlled',
});

const App = () => {
  const check = useFieldAtom(checkAtom);
  const firstname = useFieldAtom(firstNameAtom);

  const { useControlledField } = useFormAtoms(formAtoms);

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

      <Conditional show={check.value} fields={[firstname, lastname]}>
        <input
          {...firstname}
          onChange={e => firstname.onChange(e.target.value)}
        />
        <pre>{JSON.stringify(firstname.error)}</pre>
        <br />
        <input
          {...lastname}
          onChange={e => lastname.onChange(e.target.value)}
        />
      </Conditional>
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
      if (field.touched && !field.value.startsWith('test_')) {
        return {
          type: 'required',
          message: `Must start with "test_"`,
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
