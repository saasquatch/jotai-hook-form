import { Atom, WritableAtom } from "jotai";

type ShouldRemove<Param> = (createdAt: number, param: Param) => boolean;
interface AtomFamily<Param, AtomType> {
  (param: Param): AtomType;
  remove(param: Param): void;
  setShouldRemove(shouldRemove: ShouldRemove<Param> | null): void;
}

export type ErrorStack = ErrorType[];
export type ErrorType = {
  jsonPointer: string;
  error?: {
    type: string;
    message?: string;
  };
};

export type FieldType = "controlled" | "uncontrolled" | "transient";

export type FieldStatus = {
  value: any;
  touched: boolean;
  dirty: boolean;
};
export type FieldValidation = (
  field: FieldStatus
) => ErrorType["error"] | undefined;

export type ValidationResolver<T> = (
  data: T
) => Record<string, ErrorType["error"]>;

export type RecordOfRefs = Record<string, { current: any }>;
export type RegisterAtom = WritableAtom<null, string>;
export type RegisterGetReturn = {
  errors: Record<string, ErrorType["error"]>;
};
export type RegisterSetter = (update: string) => RegisterSetReturn;
export type RegisterSetReturn = {
  name: string;
  ref: (el: HTMLElement | null) => void;
  onChange: (value: any) => void;
  listeners: Listeners;
};

export type ControlAtom = WritableAtom<null, ControlSetParams>;
export type ControlSetParams = {
  field: string;
  validation?: FieldValidation;
};
export type ControlSetReturn = {
  listeners: Listeners;
  onChange: (value: any) => void;
};

export type Listeners = {
  onUnmount: () => void;
  onMount: () => void;
};

// export type FieldAtom = WritableAtom<Record<string, string>, FieldUpdate>;
// export type FieldUpdate = { key: string; controlled?: boolean };

export type TransientFieldStore = Record<string, any>;
export type HiddenAtom = WritableAtom<null, string>;
export type HiddenSetReturn = {
  listeners: {
    onUnmount: Listeners["onUnmount"];
  };
  onChange: (value: any) => void;
};
export type ActionsAtom = WritableAtom<null, ActionsSetter>;
export type ActionsSetter =
  | {
      action: "RESET";
    }
  | { action: unknown; next: any };

export type WatchAtom = AtomFamily<string, Atom<any>>;
export type NestedErrorsAtom = Atom<ErrorStack>;
export type NestedFormDataAtom<T> = Atom<Partial<T>>;

export type ValidationSetter<T> = {
  resolver: ValidationResolver<T>;
  data?: T;
};
export type ValidationAtom<T> = WritableAtom<null, ValidationSetter<T>>;
export type SetAtom = WritableAtom<null, SetSetter>;
export type SetSetter = { field: string; value: unknown | undefined };

export type FormAtoms<T> = {
  registerAtom: RegisterAtom;
  controlAtom: ControlAtom;
  hiddenAtom: HiddenAtom;

  formActionsAtom: ActionsAtom;
  watchAtom: WatchAtom;
  errorsAtom: NestedErrorsAtom;
  formDataAtom: NestedFormDataAtom<T>;
  validationAtom: ValidationAtom<T>;
  setAtom: SetAtom;
};

export type FieldAtom<T> = Atom<{
  nameAtom: Atom<string>;
  valueAtom: Atom<any>;
  // @ts-ignore: Necessary to define type of return from setter;
  configAtom: WritableAtom<null, undefined, T>;
  errorAtom: Atom<ErrorType["error"] | undefined>;
  touchedAtom: Atom<boolean>;
  dirtyAtom: Atom<boolean>;
}>;
export type FieldOptions = {
  validate?: FieldValidation;
  type: FieldType;
};
