import { Atom, atom, WritableAtom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import {
  get as pointerGet,
  has as pointerHas,
  remove as pointerRemove,
  set as pointerSet,
  parse as pointerParse,
} from 'json-pointer';
import { ChangeEvent, SetStateAction } from 'react';

type ShouldRemove<Param> = (createdAt: number, param: Param) => boolean;
interface AtomFamily<Param, AtomType> {
  (param: Param): AtomType;
  remove(param: Param): void;
  setShouldRemove(shouldRemove: ShouldRemove<Param> | null): void;
}

function isInput(el: HTMLElement): el is HTMLInputElement {
  return el?.tagName === 'INPUT';
}
function isSelect(el: HTMLElement): el is HTMLSelectElement {
  return el?.tagName === 'SELECT';
}

/**
 * Infers appropriate javascript type based on the input type
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input
 */
export function getFromFormElement(el: HTMLElement): unknown {
  if (isSelect(el)) {
    return el.value;
  }

  if (isInput(el)) {
    if (el.type === 'number' || el.type === 'range') {
      return el.valueAsNumber;
    } else if (el.type === 'checkbox') {
      return !!el.checked;
    } else {
      // All others assume string (even dates)
      return el.value;
    }
  }

  return undefined;
}

/**
 * Infers appropriate javascript type based on the input type
 *
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input
 */
export function setInFormElement(el: HTMLInputElement, value: unknown): void {
  if (el.type === 'number') {
    el.value = value as any;
  } else if (el.type === 'checkbox') {
    el.checked = value as boolean;
  } else {
    // All others assume string (even dates)
    el.value = value || ('' as any);
  }
}

export function getElementEvent(el: HTMLInputElement): string {
  if (el?.type === 'checkbox' || el?.type === 'radio') {
    return 'onClick';
  } else if (el?.type === 'range') {
    return 'onInput';
  }

  return 'onChange';
}

type SetterUpdate = { field: string; el: HTMLInputElement | null };
/**
 * Creates a form atom that can be registered
 *
 */
export function createFormAtoms<T extends object>({
  dataAtom,
  errorStackAtom,
  transientFieldsAtom,
}: {
  dataAtom: WritableAtom<T, SetStateAction<T>>;
  errorStackAtom: WritableAtom<ErrorStack, ErrorStack>;
  transientFieldsAtom?: WritableAtom<Record<string, any>, Record<string, any>>;
}) {
  const refsAtom = atom({} as Record<string, Set<HTMLInputElement>>);
  const fieldRegAtom = atom(new Set<string>());
  const regAtom = atom(
    get => get(refsAtom),
    (get, set, { field, el }: SetterUpdate) => {
      if (el === null) {
        set(refsAtom, prev => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      } else if (get(refsAtom)[field]?.has(el)) {
        // Already set, do nothing.
        return;
      } else {
        const data = get(dataAtom);
        if (pointerHas(data, field)) {
          const value = pointerGet(data, field);
          setInFormElement(el, value);
          set(refsAtom, prev => ({
            ...prev,
            [field]: prev[field]?.add(el) || new Set([el]),
          }));
        }
      }
    }
  );

  const initialDataBaseAtom = atom<null | Atom<any>>(null);
  const initialDataAtom = atom(
    get => get(initialDataBaseAtom),
    (get, set, _dataAtom: Atom<any>) => {
      set(initialDataBaseAtom, get(_dataAtom));
    }
  );
  initialDataAtom.onMount = setAtom => {
    setAtom(dataAtom);
  };

  const touchedFieldsAtom = atom(new Set<string>());

  const fieldMetaAtom = atomFamily((field: string) =>
    atom(get => {
      const data = get(dataAtom);
      const initialData = get(initialDataAtom);
      if (!pointerHas(data, field)) return undefined;

      const touchedFields = get(touchedFieldsAtom);

      const fieldVal = pointerGet(data, field);

      console.log({ initialData, fieldVal });

      const dirty =
        !!initialData &&
        (!pointerHas(initialData, field) ||
          (pointerHas(initialData, field) &&
            fieldVal !== pointerGet(initialData, field)));

      const touched = touchedFields.has(field);

      return { dirty, touched };
    })
  );

  const errorAtom = atomFamily((field: string) =>
    atom(get => {
      const valueAtom = watchAtom(field);
      const metaAtom = fieldMetaAtom(field);

      return (rule: (value: any) => boolean) => {
        const meta = get(metaAtom);
        if (meta?.touched && meta?.dirty) return !rule(get(valueAtom));
        return false;
      };
    })
  );

  /** Atom that listens to DOM changes on an attached element */
  const registerAtom: RegisterAtom = atom(
    _ => null,
    (get, set, field: string) => {
      if (!get(fieldRegAtom).has(field))
        set(fieldRegAtom, prev => prev.add(field));

      const inputEl = Array.from(get(regAtom)[field]?.values() || [])[0];
      const onEvent = getElementEvent(inputEl);
      return {
        name: field,
        listeners: {
          onMount: () => {
            set(dataAtom, prev => {
              const next = { ...prev };
              if (!pointerHas(next, field)) pointerSet(next, field, undefined);
              return next;
            });
          },
          onUnmount: () => {
            set(dataAtom, prev => {
              const next = { ...prev };
              if (pointerHas(next, field)) {
                pointerRemove(next, field);
              }
              return next;
            });
          },
        },
        ref: (el: HTMLInputElement | null) => {
          set(regAtom, { field, el });
        },
        [onEvent]: (e: ChangeEvent) => {
          // Get ref field object
          const el = e.target as HTMLInputElement;
          const value = getFromFormElement(el);

          if (!get(touchedFieldsAtom).has(field))
            set(touchedFieldsAtom, prev => prev.add(field));

          if (value === '') {
            set(dataAtom, prev => {
              const next = { ...prev };
              pointerRemove(next, field);
              return next;
            });
            return;
          }

          // Trigger refresh of ref atom
          set(dataAtom, prev => {
            const next = { ...prev };
            pointerSet(next, field, value);
            return next;
          });
        },
      };
    }
  );

  /** Atom that provides control to controlled components */
  /** Attaches directly to the dataAtom */

  const controlAtom: ControlAtom = atom(
    _ => null,
    (get, set, field) => {
      if (!get(fieldRegAtom).has(field))
        set(fieldRegAtom, prev => prev.add(field));

      return {
        listeners: {
          onMount: () => {
            set(dataAtom, prev => {
              const next = { ...prev };
              if (!pointerHas(next, field)) pointerSet(next, field, undefined);
              return next;
            });
          },
          onUnmount: () => {
            set(dataAtom, prev => {
              const next = { ...prev };
              if (pointerHas(next, field)) {
                pointerRemove(next, field);
              }
              return next;
            });
          },
        },
        onChange: (value: unknown) => {
          set(dataAtom, prev => {
            const next = { ...prev };
            pointerSet(next, field, value);
            return next;
          });

          if (!get(touchedFieldsAtom).has(field))
            set(touchedFieldsAtom, prev => prev.add(field));
        },
      };
    }
  );

  const transientFieldStoreBaseAtom = atom<TransientFieldStore>({});
  const transientFieldStoreAtom = atom<
    TransientFieldStore,
    TransientFieldStore
  >(
    get => {
      if (transientFieldsAtom) return get(transientFieldsAtom);
      return get(transientFieldStoreBaseAtom);
    },
    (_, set, next) => {
      if (transientFieldsAtom) set(transientFieldsAtom, next);
      set(transientFieldStoreBaseAtom, next);
    }
  );

  const hiddenAtom: HiddenAtom = atom(
    _ => null,
    (_, set, field: string) => {
      return {
        listeners: {
          onUnmount: () => {
            set(transientFieldStoreAtom, (prev: TransientFieldStore) => {
              const next = { ...prev };
              delete next[field];
              return next;
            });
          },
        },
        onChange: (value: unknown) => {
          set(transientFieldStoreAtom, (prev: TransientFieldStore) => ({
            ...prev,
            [field]: value,
          }));
        },
      };
    }
  );

  const formActionsAtom: ActionsAtom = atom(null, (get, set, reduce) => {
    if (reduce.action === 'RESET') {
      const refs = get(refsAtom);
      const refKeys = Object.keys(refs);

      refKeys.forEach(refKey => {
        Array.from(refs[refKey]).forEach(el => {
          setInFormElement(el, null);
        });
      });
      set(refsAtom, {});
      set(transientFieldStoreAtom, {});
      set(dataAtom, () => ({} as T));
    }
  });

  const watchAtom: WatchAtom = atomFamily(<X>(field: string) =>
    atom<X>(get => {
      if (field in get(transientFieldStoreAtom)) {
        return get(transientFieldStoreAtom)[field];
      }

      const data = get(dataAtom);
      if (pointerHas(data, field)) {
        return pointerGet(data, field);
      }
      return undefined;
    })
  );

  /** Filters error stack for only the errors in the current form
   * Useful for getting errors for nested forms
   */
  const errorsAtom: NestedErrorsAtom = atom(get => {
    const errorStack = get(errorStackAtom);
    const fieldReg = Array.from(get(fieldRegAtom));
    const subErrors = fieldReg
      .map(field => getSubErrors(errorStack, field))
      .flatMap(field => field);

    return subErrors;
  });

  const validationAtom: ValidationAtom<T> = atom(
    null,
    (get, set, { resolver, data }) => {
      const baseData = data ? data : get(dataAtom);
      const validationErrors = resolver(baseData);
      const mapToArray = Object.keys(validationErrors).map(key => ({
        jsonPointer: key,
        error: validationErrors[key],
      }));
      set(errorStackAtom, mapToArray);
    }
  );

  /** Returns a shallow copy of the part of the data object
      associated with this form instance */
  const formDataAtom: NestedFormDataAtom<T> = atom(get => {
    const data = get(dataAtom);
    const fieldReg = Array.from(get(fieldRegAtom));
    return fieldReg.reduce((prev, field: string) => {
      const token = pointerParse(field)[0];
      if (pointerHas(data, `/${token}`)) {
        const value = pointerGet(data, `/${token}`);
        return { ...prev, [token]: value };
      }
      return prev;
    }, {});
  });

  /** Set an individual field in the form */
  const setAtom: SetAtom = atom(null, (get, set, { field, value }) => {
    if (field in get(transientFieldStoreAtom)) {
      set(transientFieldStoreAtom, (prev: TransientFieldStore) => {
        const next = { ...prev };
        next[field] = value;
        return next;
      });
      return;
    }

    set(dataAtom, prev => {
      const next = { ...prev };
      if (pointerHas(next, field)) {
        pointerSet(next, field, value);
      }
      return next;
    });
  });

  return {
    registerAtom,
    controlAtom,
    hiddenAtom,
    formActionsAtom,
    watchAtom,
    validationAtom,
    setAtom,
    errorAtom,
    initialDataAtom,

    // Only helpful for nested forms
    errorsAtom,
    formDataAtom,
  };
}

export function getSubErrors(
  errorStack: ErrorStack,
  jsonPointer: string | string[]
) {
  if (typeof jsonPointer === 'string')
    return errorStack.filter(
      error =>
        error.jsonPointer === jsonPointer ||
        error.jsonPointer.startsWith(jsonPointer)
    );

  // Array of strings
  return errorStack.filter(error => jsonPointer.includes(error.jsonPointer));
}

export function hasSubErrors(
  errorStack: ErrorStack,
  jsonPointer: string | string[]
) {
  return getSubErrors(errorStack, jsonPointer).length > 0;
}

export type ErrorStack = ErrorType[];
export type ErrorType = {
  jsonPointer: string;
  error: {
    type: string;
    message?: string;
  };
};

export type ValidationResolver<T> = (
  data: T
) => Record<string, ErrorType['error']>;

export type RecordOfRefs = Record<string, { current: any }>;
export type RegisterAtom = WritableAtom<null, string>;
export type RegisterGetReturn = {
  errors: Record<string, ErrorType['error']>;
};
export type RegisterSetter = (update: string) => RegisterSetReturn;
export type RegisterSetReturn = {
  name: string;
  ref: (el: HTMLElement | null) => void;
  onChange: (value: any) => void;
  listeners: Listeners;
};

export type ControlAtom = WritableAtom<null, string>;
export type ControlSetReturn = {
  listeners: Listeners;
  onChange: (value: any) => void;
};

export type Listeners = {
  onUnmount: () => void;
  onMount: () => void;
};

export type FieldAtom = WritableAtom<Record<string, string>, FieldUpdate>;
export type FieldUpdate = { key: string; controlled?: boolean };

export type TransientFieldStore = Record<string, any>;
export type HiddenAtom = WritableAtom<null, string>;
export type HiddenSetReturn = {
  listeners: {
    onUnmount: Listeners['onUnmount'];
  };
  onChange: (value: any) => void;
};
export type ActionsAtom = WritableAtom<null, ActionsSetter>;
export type ActionsSetter =
  | {
      action: 'RESET';
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
