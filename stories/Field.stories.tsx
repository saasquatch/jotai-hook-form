import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import React, { useMemo, useState } from 'react';
import { Conditional } from '../src/Conditional';
import { createFormAtoms } from '../src/createForm';
import { useFormAtoms } from '../src/useFormAtoms';

export default {
  title: 'Jotai Hook Form / Base',
};

const useFormStory = (dataAtom: any) => {
  const errorsAtom = React.useMemo(() => atom({}), []);
  const formAtoms = React.useMemo(
    () => createFormAtoms({ dataAtom, errorsAtom }),
    []
  );
  const saveAtom = atom(null, (get, set) => {
    const data = get(dataAtom);
    console.log('Save:', { data });
  });

  return {
    formAtoms,
    saveAtom,
    dataAtom,
  };
};

export const Basic = () => {
  const dataAtom = React.useMemo(() => atom({}), []);
  const { formAtoms } = useFormStory(dataAtom);
  const { useField, useControlledField } = useFormAtoms(formAtoms);
  const controlledField = useControlledField('/controlled');
  const uncontrolledField = useField('/uncontrolled');

  return (
    <>
      <label htmlFor="/controlled">Controlled Field</label>
      <input
        {...controlledField}
        onChange={(e) => controlledField.onChange(e.target.value)}
      />
      <label htmlFor="/uncontrolled">Uncontrolled Field</label>
      <input {...uncontrolledField} />
    </>
  );
};

export const ConditionalOnUncontrolledField = () => {
  const dataAtom = React.useMemo(() => atom({}), []);
  const { formAtoms } = useFormStory(dataAtom);
  const { useField, useControlledField } = useFormAtoms(formAtoms);
  // const field = useSetAtom(formAtoms.registerFieldAtom);
  const firstNameAtom = React.useMemo(
    () => formAtoms.watchAtom('/input'),
    [formAtoms]
  );
  const showConditionalAtom = React.useMemo(
    () =>
      atom((get) => {
        const firstName = get(firstNameAtom);
        return !!firstName;
      }),
    []
  );
  const showConditional = useAtomValue(showConditionalAtom);

  const inputField = useField('/input');
  const emailField = useControlledField('/email');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <input {...inputField} />
      <Conditional show={showConditional} {...emailField.listeners}>
        <input
          {...emailField}
          onChange={(e) => emailField.onChange(e.target.value)}
        />
      </Conditional>
    </div>
  );
};

export const RadioFields = () => {
  const dataAtom = React.useMemo(() => atom({}), []);
  const { formAtoms, saveAtom } = useFormStory(dataAtom);
  const { useField, useControlledField } = useFormAtoms(formAtoms);
  const save = useSetAtom(saveAtom);

  const controlledRadioField = useControlledField('/controlledRadio');
  const uncontrolledRadioField = useField('/uncontrolledRadio');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <p>Controlled Radios</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="radio"
            checked={controlledRadioField.value === 'a'}
            value="a"
            onChange={(e) => controlledRadioField.onChange(e.target.value)}
          />
          <input
            type="radio"
            checked={controlledRadioField.value === 'b'}
            value="b"
            onChange={(e) => controlledRadioField.onChange(e.target.value)}
          />
          <input
            type="radio"
            checked={controlledRadioField.value === 'c'}
            value="c"
            onChange={(e) => controlledRadioField.onChange(e.target.value)}
          />
        </div>
      </div>
      <div>
        <p>Uncontrolled Radios</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="radio" value="a" {...uncontrolledRadioField} />
          <input type="radio" value="b" {...uncontrolledRadioField} />
          <input type="radio" value="c" {...uncontrolledRadioField} />
        </div>
      </div>
      <button onClick={save}>Save</button>
    </div>
  );
};

export const ConditionalRadioFields = () => {
  const dataAtom = React.useMemo(() => atom({}), []);
  const { formAtoms, saveAtom } = useFormStory(dataAtom);
  const { useField, useControlledField } = useFormAtoms(formAtoms);
  const save = useSetAtom(saveAtom);

  const controlledRadioField = useControlledField('/controlledRadio');
  const firstNameField = useField('/firstName');

  const radioAtom = React.useMemo(
    () => formAtoms.watchAtom('/controlledRadio'),
    []
  );
  const showFirstNameAtom = useMemo(
    () =>
      atom((get) => {
        const value = get(radioAtom);
        return value === 'a';
      }),
    [radioAtom]
  );
  const showFirstName = useAtomValue(showFirstNameAtom);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <p>Controlled Radios</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="radio"
            checked={controlledRadioField.value === 'a'}
            value="a"
            onChange={(e) => controlledRadioField.onChange(e.target.value)}
          />
          <input
            type="radio"
            checked={controlledRadioField.value === 'b'}
            value="b"
            onChange={(e) => controlledRadioField.onChange(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Conditional show={showFirstName} {...firstNameField.listeners}>
          <input type="text" {...firstNameField} />
        </Conditional>
      </div>
      <button onClick={save}>Save</button>
    </div>
  );
};

export const MultipleConditionalFields = () => {
  const dataAtom = useMemo(() => atom({}), []);
  const { formAtoms, saveAtom } = useFormStory(dataAtom);
  const { useField } = useFormAtoms(formAtoms);
  const save = useSetAtom(saveAtom);

  const checkbox1Atom = React.useMemo(
    () => formAtoms.watchAtom('/checkbox1'),
    []
  );
  const checkbox2Atom = React.useMemo(
    () => formAtoms.watchAtom('/checkbox2'),
    []
  );
  const showSection1Atom = React.useMemo(
    () => atom((get) => !!get(checkbox1Atom)),
    []
  );
  const showSection2Atom = React.useMemo(
    () => atom((get) => get(showSection1Atom) && !!get(checkbox2Atom)),
    []
  );

  const showSection1 = useAtomValue(showSection1Atom);
  const showSection2 = useAtomValue(showSection2Atom);

  const checkbox1Field = useField('/checkbox1');
  const input1Field = useField('/input1');
  const input2Field = useField('/input2');
  const checkbox2Field = useField('/checkbox2');
  const input3Field = useField('/input3');
  const input4Field = useField('/input4');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <label htmlFor="/checkbox1">Show section 1</label>
      <input type="checkbox" {...checkbox1Field} />
      <Conditional show={showSection1} {...input1Field.listeners}>
        <input type="text" {...input1Field} />
      </Conditional>
      <Conditional show={showSection1} {...input2Field.listeners}>
        <input type="text" {...input2Field} />
      </Conditional>
      <Conditional show={showSection1} {...checkbox2Field.listeners}>
        <label htmlFor="/checkbox2">Show section 2</label>
        <input type="checkbox" {...checkbox2Field} />
      </Conditional>
      <Conditional
        show={showSection1 && showSection2}
        {...input3Field.listeners}
      >
        <input type="text" {...input3Field} />
      </Conditional>
      <Conditional
        show={showSection1 && showSection2}
        {...input4Field.listeners}
      >
        <input type="text" {...input4Field} />
      </Conditional>
      <button onClick={save}>Save</button>
    </div>
  );
};

export const CombineForms = () => {
  const dataAtom = useMemo(() => atom({}), []);
  const saveAtom = useMemo(() => atom(null, (get, set) => {}), []);
  const save = useSetAtom(saveAtom);

  const { formAtoms: form1Atoms } = useFormStory(dataAtom);
  // One form
  const { useField: useField1 } = useFormAtoms(form1Atoms);

  const firstNameField = useField1('/firstName');
  const lastNameField = useField1('/lastName');

  const { formAtoms: form2Atoms } = useFormStory(dataAtom);
  // Two form
  const { useField: useField2 } = useFormAtoms(form2Atoms);
  const countryField = useField2('/country');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h2>Form one</h2>
      <label htmlFor="/firstName">First name</label>
      <input {...firstNameField} />
      <label htmlFor="/lastName">Last Name</label>
      <input {...lastNameField} />
      <hr />
      <h2>Form two</h2>
      <label htmlFor="/country">Country</label>
      <input {...countryField} />
      <button onClick={save}>Save</button>
    </div>
  );
};
