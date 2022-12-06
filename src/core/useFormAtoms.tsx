import { Atom, useAtomValue, useSetAtom } from 'jotai';
import { useMemo } from 'react';
import { createFormAtoms } from './createForm';
import {
  FieldValidation,
  // ControlSetParams,
  // ControlSetReturn,
  // RegisterSetter,
} from './types';

export const useFieldAtom = (fieldAtom: Atom<any>) => {
  const field = useAtomValue(fieldAtom);

  const value = useAtomValue(field.valueAtom);
  const error = useAtomValue(field.errorAtom);
  const dirty = useAtomValue(field.dirtyAtom);
  const touched = useAtomValue(field.touchedAtom);
  const config = useSetAtom(field.configAtom);

  return {
    error,
    ...config(),
    ...(value === null ? {} : { value }),
    status: {
      dirty,
      touched,
    },
  };
};

export function useFormAtoms(formAtoms: ReturnType<typeof createFormAtoms>) {
  const hidden = useSetAtom(formAtoms.hiddenAtom);

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
          controlled: false,
        }),
      []
    );

    const field = useFieldAtom(fieldAtom);

    return {
      ...field,
      onChange: (value: any) => {
        options?.onChangeMiddleware && options.onChangeMiddleware(value);
        // @ts-ignore;
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
          controlled: true,
        }),
      []
    );

    const field = useFieldAtom(fieldAtom);

    return {
      ...field,
      onChange: (value: any) => {
        options?.onChangeMiddleware && options.onChangeMiddleware(value);
        // @ts-ignore;
        field.onChange(value);
      },
    };
  };

  const useTransientField = (
    field: string,
    options?: { onChangeMiddleware: (param: any) => void }
  ) => {
    const watchAtom = formAtoms.watchAtom(field);

    const value = useAtomValue(watchAtom);
    const obj = (hidden as (update: string) => any)(field);
    return {
      error: null,
      value,
      ...obj,
      onChange: (value: any) => {
        options?.onChangeMiddleware && options.onChangeMiddleware(value);
        obj.onChange(value);
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
