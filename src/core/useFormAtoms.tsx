import { useAtomValue, useSetAtom, WritableAtom } from 'jotai';
import { useMemo } from 'react';
import { createFormAtoms } from './createForm';
import { FieldAtom, FieldValidation } from './types';

export const useFieldAtom = <T,>(fieldAtom: FieldAtom<T>) => {
  const field = useAtomValue(fieldAtom);

  const name = useAtomValue(field.nameAtom);
  const value = useAtomValue(field.valueAtom);
  const error = useAtomValue(field.errorAtom);
  const dirty = useAtomValue(field.dirtyAtom);
  const touched = useAtomValue(field.touchedAtom);

  const config = useSetAtom(
    (field.configAtom as unknown) as WritableAtom<null, undefined>
  );

  return {
    name,
    error,
    ...((config() as unknown) as T),
    ...(value === null ? {} : { value }),
    status: {
      dirty,
      touched,
    },
  };
};

export function useFormAtoms(formAtoms: ReturnType<typeof createFormAtoms>) {
  const useField = (
    name: string,
    options?: {
      validate?: FieldValidation;
      onChangeMiddleware?: (param: any) => void;
    }
  ) => {
    const fieldAtom = useMemo(
      () =>
        formAtoms.fieldAtom(name, {
          validate: options?.validate,
          type: 'uncontrolled',
        }),
      []
    );

    const field = useFieldAtom(fieldAtom);

    return {
      ...field,
      onChange: (value: any) => {
        options?.onChangeMiddleware && options.onChangeMiddleware(value);
        field.onChange(value);
      },
    };
  };

  const useControlledField = (
    name: string,
    options?: {
      validate?: FieldValidation;
      onChangeMiddleware?: (param: any) => void;
    }
  ) => {
    const fieldAtom = useMemo(
      () =>
        formAtoms.fieldAtom(name, {
          validate: options?.validate,
          type: 'controlled',
        }),
      []
    );

    const field = useFieldAtom(fieldAtom);

    return {
      ...field,
      onChange: (value: any) => {
        options?.onChangeMiddleware && options.onChangeMiddleware(value);
        field.onChange(value);
      },
    };
  };

  const useTransientField = (
    name: string,
    options?: { onChangeMiddleware: (param: any) => void }
  ) => {
    const fieldAtom = useMemo(
      () =>
        formAtoms.fieldAtom(name, {
          type: 'transient',
        }),
      []
    );

    const field = useFieldAtom(fieldAtom);

    return {
      ...field,
      onChange: (value: any) => {
        options?.onChangeMiddleware && options.onChangeMiddleware(value);
        field.onChange(value);
      },
    };
  };

  return { useField, useControlledField, useTransientField };
}

type MockOptions = {
  error?: { type: string; message?: string | undefined };
  value?: any;
};
export function mockField(options?: MockOptions) {
  return {
    name: '',
    ref: () => null,
    value: options?.value,
    error: options?.error,
    onChange: (value: any) => console.debug('onChange', value),
    listeners: {
      onMount: () => {},
      onUnmount: () => {},
    },
  };
}
