import { useAtomValue, useSetAtom } from 'jotai';
import {
  ControlSetReturn,
  createFormAtoms,
  RegisterSetter,
} from './createForm';

export function useFormAtoms(formAtoms: ReturnType<typeof createFormAtoms>) {
  const control = useSetAtom(formAtoms.controlAtom);
  const register = useSetAtom(formAtoms.registerAtom);
  const hidden = useSetAtom(formAtoms.hiddenAtom);
  const errors = useAtomValue(formAtoms.errorsAtom);
  useAtomValue(formAtoms.initialDataAtom);

  const useField = (
    field: string,
    options?: {
      validate: (value: string) => boolean;
      errorMessage: string;
    }
  ) => {
    const errorAtom = formAtoms.errorAtom(field);
    const error = useAtomValue(errorAtom);
    return {
      error: options?.validate
        ? error(options.validate) &&
          (options?.errorMessage || `Error on field: ${field}`)
        : errors.find(error => error.jsonPointer === field)?.error,
      ...(register as RegisterSetter)(field),
    };
  };

  const useControlledField = (
    field: string,
    options?: {
      validate: (value: string) => boolean;
      errorMessage: string;
      onChangeMiddleware: (param: any) => void;
    }
  ) => {
    const watchAtom = formAtoms.watchAtom(field);
    const errorAtom = formAtoms.errorAtom(field);

    const error = useAtomValue(errorAtom);
    const value = useAtomValue(watchAtom);
    const obj = (control as (update: string) => ControlSetReturn)(field);

    return {
      error: options?.validate
        ? error(options.validate) &&
          (options?.errorMessage || `Error on field: ${field}`)
        : errors.find(error => error.jsonPointer === field)?.error,
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
