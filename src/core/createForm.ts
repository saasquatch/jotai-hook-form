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
import {
  ActionsAtom,
  ControlAtom,
  ControlSetReturn,
  ErrorStack,
  FieldAtom,
  FieldType,
  FieldValidation,
  HiddenAtom,
  HiddenSetReturn,
  NestedErrorsAtom,
  NestedFormDataAtom,
  RegisterAtom,
  RegisterSetReturn,
  SetAtom,
  TransientFieldStore,
  ValidationAtom,
  WatchAtom,
} from './types';

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
export function createFormAtoms<FormData extends object>({
  dataAtom,
  errorStackAtom,
  transientFieldsAtom,
}: {
  dataAtom: WritableAtom<FormData, SetStateAction<FormData>>;
  errorStackAtom?: WritableAtom<ErrorStack, SetStateAction<ErrorStack>>;
  transientFieldsAtom?: WritableAtom<Record<string, any>, Record<string, any>>;
}) {
  const refsAtom = atom({} as Record<string, Set<HTMLInputElement>>);
  const fieldRegAtom = atom(new Set<string>());
  const fieldValidationAtom = atom<Record<string, FieldValidation>>({});
  const touchedFieldsAtom = atom(new Set<string>());

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

  /**
   * Contains array of ErrorStack objects
   *
   * @description Modify to edit the errors that are mapped to a field
   *              via the corresponding json-pointer
   */
  const errorStackBaseAtom = errorStackAtom || atom([] as ErrorStack);
  const checkErrorAtom = atom(
    null,
    (get, set, { field, value }: { field: string; value: any }) => {
      const data = get(dataAtom);
      const dirty = get(trackDirtyAtom(field));
      const touched = get(trackTouchedAtom(field));

      // Run validation if it exists
      const fieldValidation = get(fieldValidationAtom);
      if (fieldValidation[field] && pointerHas(data, field)) {
        const error = fieldValidation[field]({ value, dirty, touched });
        if (error) {
          set(errorStackBaseAtom, prev => [
            ...prev,
            ...(error
              ? [
                  {
                    jsonPointer: field,
                    error,
                  },
                ]
              : []),
          ]);
        } else {
          set(errorStackBaseAtom, prev =>
            prev.filter(_field => _field.jsonPointer !== field)
          );
        }
      }
    }
  );

  const initialDataBaseAtom = atom<null | FormData>(null);
  const initialDataAtom = atom(
    get => get(initialDataBaseAtom),
    (get, set, _dataAtom: Atom<FormData>) => {
      set(initialDataBaseAtom, get(_dataAtom));
    }
  );
  initialDataAtom.onMount = setAtom => {
    // Stop more updates
    setAtom(dataAtom);
  };

  const trackDirtyAtom = atomFamily<string, Atom<boolean>>(field =>
    atom(get => {
      const data = get(dataAtom);
      const initialData = get(initialDataAtom);
      if (!pointerHas(data, field)) return false;

      const fieldVal = pointerGet(data, field);

      // Dirty if value differs from initial data
      const dirty =
        !!initialData &&
        (!pointerHas(initialData, field) ||
          (pointerHas(initialData, field) &&
            fieldVal !== pointerGet(initialData, field)));

      return dirty;
    })
  );
  const trackTouchedAtom = atomFamily((field: string) =>
    atom(get => {
      const touchedFields = get(touchedFieldsAtom);

      return touchedFields.has(field);
    })
  );

  /**
   *
   * @param field Json pointer to the associated property on the data object
   * @param options
   * @returns
   *
   *   `valueAtom`: Value of the field in dataAtom, otherwise `null`
   *
   *   `nameAtom`: Json pointer of field
   *
   *   `configAtom`: Any event listeners needs to connect to DOM
   *
   *   `errorAtom`: Field error
   */
  function fieldAtom(
    field: string,
    options?: {
      validate?: FieldValidation;
      type: 'controlled';
    }
  ): FieldAtom<ControlSetReturn>;
  function fieldAtom(
    field: string,
    options?: {
      validate?: FieldValidation;
      type: 'uncontrolled';
    }
  ): FieldAtom<RegisterSetReturn>;
  function fieldAtom(
    field: string,
    options?: {
      validate?: FieldValidation;
      type: 'transient';
    }
  ): FieldAtom<HiddenSetReturn>;
  function fieldAtom(
    field: string,
    options?: {
      validate?: FieldValidation;
      type?: FieldType;
    }
  ) {
    const nameAtom = atom(field);

    const valueBaseAtom = atom(get => {
      if (options?.type !== 'uncontrolled') {
        if (field in get(transientFieldStoreAtom)) {
          return get(transientFieldStoreAtom)[field];
        }

        const data = get(dataAtom);
        if (pointerHas(data, field)) {
          return pointerGet(data, field);
        }
      } else {
        return null;
      }
    });

    const valueAtom = atom(
      get => get(valueBaseAtom),
      (get, set) => {
        set(initialDataBaseAtom, prev => {
          const next = { ...prev };
          pointerSet(next, field, get(valueBaseAtom));
          return next as FormData;
        });
      }
    );
    valueAtom.onMount = setAtom => {
      setAtom();
    };

    const dirtyAtom = trackDirtyAtom(field);
    const touchedAtom = trackTouchedAtom(field);
    const fieldErrorAtom = errorAtom(field);

    const configAtom: WritableAtom<null, undefined, any> = atom(
      _ => null,
      (_, set) => {
        switch (options?.type) {
          case 'uncontrolled':
            return (set(registerAtom, field) as unknown) as RegisterSetReturn;
          case 'transient':
            return (set(hiddenAtom, field) as unknown) as HiddenSetReturn;
          default:
            return (set(controlAtom, {
              field,
              validation: options?.validate,
            }) as unknown) as ControlSetReturn;
        }
      }
    );

    return atom({
      nameAtom,
      valueAtom,
      configAtom,
      errorAtom: fieldErrorAtom,
      dirtyAtom,
      touchedAtom,
    });
  }

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
        onBlur: () => {
          if (!get(touchedFieldsAtom).has(field))
            set(
              touchedFieldsAtom,
              prev => new Set(Array.from(prev.add(field)))
            );
        },
        [onEvent]: (e: ChangeEvent) => {
          // Get ref field object
          const el = e.target as HTMLInputElement;
          const value = getFromFormElement(el);

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
    (get, set, { field, validation }) => {
      if (!get(fieldRegAtom).has(field)) {
        set(fieldRegAtom, prev => prev.add(field));
        validation &&
          set(fieldValidationAtom, prev => ({ ...prev, [field]: validation }));
      }

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
        onBlur: () => {
          set(touchedFieldsAtom, prev => new Set(Array.from(prev.add(field))));
        },
        onChange: (value: unknown) => {
          // Update data atom
          set(dataAtom, prev => {
            const next = { ...prev };
            pointerSet(next, field, value);
            return next;
          });

          // Update error with new value
          set(checkErrorAtom, { value, field });
        },
      };
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
      set(dataAtom, () => ({} as FormData));
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

  const errorAtom = atomFamily((field: string) =>
    atom(get => {
      const errorStore = get(errorStackBaseAtom);
      return errorStore.find(error => error.jsonPointer === field)?.error;
    })
  );

  /** Filters error stack for only the errors in the current form
   * Useful for getting errors for nested forms
   */
  const errorsAtom: NestedErrorsAtom = atom(get => {
    const errorStack = get(errorStackBaseAtom);
    const fieldReg = Array.from(get(fieldRegAtom));
    const subErrors = fieldReg
      .map(field => getSubErrors(errorStack, field))
      .flatMap(field => field);

    return subErrors;
  });

  const validationAtom: ValidationAtom<FormData> = atom(
    null,
    (get, set, { resolver, data }) => {
      const baseData = data ? data : get(dataAtom);
      const validationErrors = resolver(baseData);
      const mapToArray = Object.keys(validationErrors).map(key => ({
        jsonPointer: key,
        error: validationErrors[key],
      }));
      set(errorStackBaseAtom, mapToArray);
    }
  );

  /** Returns a shallow copy of the part of the data object
      associated with this form instance */
  const formDataAtom: NestedFormDataAtom<FormData> = atom(get => {
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
    fieldAtom,
    hiddenAtom,
    formActionsAtom,
    watchAtom,
    validationAtom,
    setAtom,
    errorAtom,
    errorStackAtom: errorStackBaseAtom,

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
