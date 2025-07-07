import { useAtomValue, useSetAtom } from "jotai/react";
import { useMemo } from "react";
import { createFormAtoms } from "../core/createForm";
import {
  ControlSetReturn,
  ErrorType,
  FieldAtom,
  FieldValidation,
  HiddenSetReturn,
  RegisterSetReturn
} from "../core/types";

export type UseFieldAtomCommon = {
  name: string;
  error: undefined | ErrorType["error"];
  status: {
    dirty: boolean;
    touched: boolean;
  };
};

export function useFieldAtom<T>(
  fieldAtom: FieldAtom<RegisterSetReturn>
): RegisterSetReturn & UseFieldAtomCommon;
export function useFieldAtom<T>(
  fieldAtom: FieldAtom<ControlSetReturn>
): ControlSetReturn & { value: T } & UseFieldAtomCommon;
export function useFieldAtom<T>(
  fieldAtom: FieldAtom<HiddenSetReturn>
): HiddenSetReturn & UseFieldAtomCommon;
export function useFieldAtom<R>(
  fieldAtom: FieldAtom<R>
): R & UseFieldAtomCommon {
  const field = useAtomValue(fieldAtom);

  const name = useAtomValue(field.nameAtom);
  const value = useAtomValue(field.valueAtom);
  const error = useAtomValue(field.errorAtom);
  const dirty = useAtomValue(field.dirtyAtom);
  const touched = useAtomValue(field.touchedAtom);

  const config = useSetAtom(field.configAtom);

  return {
    name,
    error,
    // @ts-ignore;
    ...config(),
    ...(value === null ? {} : { value }),
    status: {
      dirty,
      touched
    }
  };
}

export function useFormAtoms(formAtoms: ReturnType<typeof createFormAtoms>) {
  const useField = <T>(
    name: string,
    options?: {
      validate?: FieldValidation;
      onChangeMiddleware?: (param: T) => void;
    }
  ) => {
    const fieldAtom = useMemo(
      () =>
        formAtoms.fieldAtom(name, {
          validate: options?.validate,
          type: "uncontrolled"
        }),
      []
    );

    const field = useFieldAtom(fieldAtom);

    return {
      ...field,
      onChange: (value: T) => {
        options?.onChangeMiddleware && options.onChangeMiddleware(value);
        field.onChange(value);
      }
    };
  };

  const useControlledField = <T>(
    name: string,
    options?: {
      validate?: FieldValidation;
      onChangeMiddleware?: (param: T) => void;
    }
  ) => {
    const fieldAtom = useMemo(
      () =>
        formAtoms.fieldAtom(name, {
          validate: options?.validate,
          type: "controlled"
        }),
      []
    );

    const field = useFieldAtom(fieldAtom);

    return {
      ...field,
      onChange: (value: T) => {
        options?.onChangeMiddleware && options.onChangeMiddleware(value);
        field.onChange(value);
      }
    };
  };

  const useTransientField = <T>(
    name: string,
    options?: { onChangeMiddleware: (param: T) => void }
  ) => {
    const fieldAtom = useMemo(
      () =>
        formAtoms.fieldAtom(name, {
          type: "transient"
        }),
      []
    );

    const field = useFieldAtom(fieldAtom);

    return {
      ...field,
      onChange: (value: T) => {
        options?.onChangeMiddleware && options.onChangeMiddleware(value);
        field.onChange(value);
      }
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
    name: "",
    ref: () => null,
    value: options?.value,
    error: options?.error,
    onChange: (value: any) => console.debug("onChange", value),
    listeners: {
      onMount: () => {},
      onUnmount: () => {}
    }
  };
}
