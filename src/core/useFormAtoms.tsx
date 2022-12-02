import { useAtomValue, useSetAtom } from 'jotai';
import { createFormAtoms } from './createForm';
import {
  ControlSetParams,
  ControlSetReturn,
  FieldValidation,
  RegisterSetter,
} from './types';

export function useFormAtoms(formAtoms: ReturnType<typeof createFormAtoms>) {
  const control = useSetAtom(formAtoms.controlAtom);
  const register = useSetAtom(formAtoms.registerAtom);
  const hidden = useSetAtom(formAtoms.hiddenAtom);

  const useField = (
    field: string
    // options?: {
    //   validate?: FieldValidation;
    //   errorMessage?: string;
    // }
  ) => {
    const errorAtom = formAtoms.errorAtom(field);
    const error = useAtomValue(errorAtom);
    return {
      error,
      ...(register as RegisterSetter)(field),
    };
  };

  const useControlledField = (
    field: string,
    options?: {
      validate?: FieldValidation;
      onChangeMiddleware?: (param: any) => void;
    }
  ) => {
    const watchAtom = formAtoms.watchAtom(field);
    const errorAtom = formAtoms.errorAtom(field);

    const error = useAtomValue(errorAtom);
    const value = useAtomValue(watchAtom);
    const obj = (control as (params: ControlSetParams) => ControlSetReturn)({
      field,
      validation: options?.validate,
    });

    return {
      error,
      value,
      ...obj,
      onChange: (value: any) => {
        options?.onChangeMiddleware && options.onChangeMiddleware(value);
        obj.onChange(value);
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
