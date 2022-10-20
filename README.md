# `jotai-hook-form`

`jotai-hook-form` is a way to build out complex forms with jotai, built off of JSON Pointers.

Inspired by `react-hook-form`, it allows for the progressive building of a form data object, letting you add fields one-at-a-time and manage the form data one field at a time.

## Table of Contents
- [`jotai-hook-form`](#jotai-hook-form)
  - [Table of Contents](#table-of-contents)
  - [Example](#example)
    - [1. Initialise form atoms](#1-initialise-form-atoms)
    - [2. Build the form object](#2-build-the-form-object)
    - [3. Attach to the view](#3-attach-to-the-view)
  - [Building blocks](#building-blocks)
    - [Atom level: `createFormAtoms`](#atom-level-createformatoms)
    - [Hook level: `useFormAtoms`](#hook-level-useformatoms)
  - [Types of fields](#types-of-fields)
    - [Uncontrolled fields: `useField`, `registerAtom`](#uncontrolled-fields-usefield-registeratom)
    - [Controlled fields: `useControlledField`, `controlAtom`](#controlled-fields-usecontrolledfield-controlatom)
    - [Transient fields: `useTransientField`, `hiddenAtom`](#transient-fields-usetransientfield-hiddenatom)
    - [Conditional fields: `<Conditional>`](#conditional-fields-conditional)
  - [Deep dive](#deep-dive)
    - [Available atoms](#available-atoms)
      - [`registerAtom`](#registeratom)
      - [`controlAtom`](#controlatom)
      - [`hiddenAtom`](#hiddenatom)
      - [`watchAtom`](#watchatom)
      - [`validationAtom`](#validationatom)
    - [Available hooks](#available-hooks)
      - [`useField`](#usefield)
      - [`useControlledField`](#usecontrolledfield)
      - [`useTransientField`](#usetransientfield)
  - [Mocking](#mocking)
    - [`mockField`](#mockfield)
  - [Typescript](#typescript)
## Example

[CodeSandbox](https://codesandbox.io/s/boring-sanderson-2g43k3?file=/src/App.tsx)
```tsx
type FormData = {
  firstName: string;
  lastName: string;
  phoneNumber: number;
};

/** 1. Initialise form atoms */
const dataAtom = atom({} as FormData);
const errorStackAtom = atom([] as ErrorStack);

const formAtoms = createFormAtoms<FormData>({ dataAtom, errorStackAtom });

...

const FormComponent = () => {
  ...

  /** 2. Build the form object */
  const { useField } = useFormAtoms(formAtoms);

  const firstName = useField("/firstName");
  const lastName = useField("/lastName");
  const phoneNumber = useField("/phoneNumber");

  return (
    <form onSubmit={onSubmit}>
      /** 3. Attach to the view */
      <input type="text" placeholder="First name" {...firstName} />
      <input type="text" placeholder="Last name" {...lastName} />
      <input type="number" placeholder="Phone number" {...phoneNumber} />
      <button type="submit">Submit</button>
    </form>
  );
};
```

### 1. Initialise form atoms
```tsx
const dataAtom = atom({} as FormData)
const errorStackAtom = atom([] as ErrorStack)

const formAtoms = createFormAtoms<FormData>({dataAtom, errorStackAtom})
```

`createFormAtoms` takes in your form data atom, and an `errorStackAtom`, and returns all the atoms necessary to start building out a form. 

### 2. Build the form object
```tsx
  const { useField } = useFormAtoms(formAtoms)

  const firstName = useField('/firstName')
  const lastName = useField('/lastName')
  const phoneNumber = useField("/phoneNumber")
```

Pass `formAtoms` (the return from `createFormAtoms`) into `useFormAtoms` to get the hooks needed to specify fields via `json-pointer` keys. With these hooks, you can start to specify what fields are included in the form. Each field key should map to a property on your data object, and be a valid JSON Pointer. [Check out the docs]() for more info on how to utilise JSON Pointers.

### 3. Attach to the view
```tsx
      <input type="text" {...firstName} />
      <input type="text" {...lastName} />
      <input type="number" {...phoneNumber} />
```

Each field initialised by `useField`, `useControlledField`, or `useTransientField` will contain the necessary properties to listen to changes in the fields. `useField` will try to be smart and listen to a specific event depending on the DOM form element attached, whereas `useControlledField` and `useTransientField` will return `value` and `onChange` properties.

## Building blocks

`jotai-hook-form` makes available to tools to built form logic both at the atom level as well as the hook level. Depending on how you build out the form at which level, there are different functions at your disposal to make it possible.

### Atom level: `createFormAtoms`

`createFormAtoms` takes in a `dataAtom` which will hold your form data object, as well as an `errorStackAtom` which will be responsible for storing a mapping from a field's JSON Pointer, to an array of errors. There is also an optional third atom parameter for `transientFieldsAtom` which will hold all values for your [transient fields](#).

```tsx
const dataAtom = atom<FormData>({})
const errorStackAtom = atom([] as ErrorStack)
const transientFieldsAtom = atom({})

const formAtoms = createFormAtoms<FormData>({
  dataAtom,
  errorStackAtom,
  transientFieldsAtom
})
```

The `createFormAtoms` function returns a list of atoms that can be used to build out forms and corresponding form logic:
- [`registerAtom`](#registeratom): Add an [uncontrolled field](#) to the form object
- [`controlAtom`](#controlatom): Add a [controlled field](#) to the form object
- [`hiddenAtom`](#hiddenatom): Add a [transient field](#) to the transient fields object
- [`watchAtom`](#watchatom): Subscribe to an individual field (both form and transient)
- [`validationAtom`](#validationatom): Takes in a resolver that maps form data to errors and stores those errors in the `errorStackAtom`
- [`formActionsAtom`](#formactionsatom): A reducer atom. Currently supports resetting of the form state.
- [`setAtom`](#setatom): Can be used to set a specific field (form or transient).

### Hook level: `useFormAtoms`

To gain control over form fields and logic within the hook level, pass in the returned object from `createFormAtoms` into the hook `useFormAtoms`.

The returned hooks handle the behaviour that would need to be manually coded if you were to only build out the form in the atom level, like listening to mounting/un-mounting, and pulling in the correct value and error for fields from your `dataAtom` and `errorStackAtom` respectively.

```tsx
...

const formAtoms = createFormAtoms<FormData>({ dataAtom, errorStackAtom })

function useForm() {
  const {
    useField,
    useControlledField,
    useTransientField
  } = useFormAtoms(formAtoms)

  ...
}
```

As seen, `useFormAtoms` returns 3 hooks, each mapping to a one of each type of field: 
- [`useField`](#usefield): uncontrolled fields (no explicit value prop)
- [`useControlledField`](#usecontrolledfield): controlled fields (explicitly set value prop)
- [`useTransientField`](#usetransientfield): transient fields (fields not storing in the data object). 

Each hook takes in a JSON Pointer that will specify the property within the data object that will correspond to a field.

## Types of fields

### Uncontrolled fields: `useField`, `registerAtom`

Uncontrolled fields are either vanilla HTML form elements (`input`, `select`, etc.) or components whose ref is attached to a vanilla form element (usually through the use of `forwardRef`). They have an internal, DOM-controlled value property that can be managed via refs, thereby not requiring re-renders to update their value within the element.

Uncontrolled fields are the optimal way to build forms as they can listen to input changes without needing a re-render to update the value in the view.

Uncontrolled fields can be handled by initialising a field with the `useField` hook, or the `registerAtom` that is returned by `createFormAtoms`

```tsx
const firstName = useField('/firstName')
```
is equivalent to 
```tsx
const firstNameAtom = set(registerAtom, '/firstName')
```

### Controlled fields: `useControlledField`, `controlAtom`

Controlled fields are the bread-and-butter for more complex forms with fields needing more advanced logic than what is available from vanilla form elements. These would include components like `react-select`'s `Select`, or simply any form component that as input `value` and `onChange` as props.

Controlled fields can be built using the `useControlledField` hook, or using the `controlAtom` - for the `onChange` injection - in combination with the `watchAtom` to get the `value`. `controlAtom` is returned by `createFormAtoms` function, whereas `useControlledField` comes from `useFormAtoms`

```tsx
const lastName = useControlledField('/lastName')
```
is equivalent to
```tsx
const lastNameChangeAtom = set(controlAtom, '/lastName')
const lastNameValueAtom = watchAtom('/lastName')
```

### Transient fields: `useTransientField`, `hiddenAtom`
"Transient" fields, as we've coined them, are fields that exist within the form's view and logic but shouldn't be stored on the form data object. This is useful for fields that conditionally render different sections of a form, where you only want to store the actual data fields and not whether the section is showing.

```tsx
const formSection = useTransientField('/currentSection')
```
is equivalent to
```tsx
const formSectionAtom = set(hiddenAtom, '/currentSection')
const formSectionValueAtom = watchAtom('/currentSection')
```

Whereas fields created with `useField`, `useControlledField` are stored within the `dataAtom`'s object, fields created with `useTransientField` are stored either in an internal store specific to transient fields, or in the optional `transientStoreAtom` parameter of `createFormAtoms`.

Note: `useTransientField` acts exactly like `useControlledField` and does not try to be smart about the DOM element it is attached to, and must be controlled explicitly.


### Conditional fields: `<Conditional>`
In the case that fields need to be removed and re-added to the form data object whenever they leave or re-enter the DOM respectively (i.e. conditional fields), the `<Conditional>` component can wrap around the element within the view to listen to these changes.

`<Conditional>` takes in 3 props:
- `show?: boolean`: A flag to conditionally render its children.
- `onMount: () => void`: A function to run on-mount.
- `onUnmount: () => void`: A function to run on-unmount.

To connect a field that has already been initialised by one of the 3 hooks returned by `useFormAtoms`, you can spread the `listeners` property of the field on `<Conditional>`. This `listeners` property contains both `onMount` and `onUnmount` functions that will handle removing/re-adding the field to the form data object on event trigger.

Example:
```tsx
...
const conditionalField = useField('/conditionalField')
const showConditional = useTransientField('/showConditional')

return (
  <form>
    <input
      type="checkbox"
      checked={showConditional.value}
      onClick={e => showConditional.onChange(!e.target.checked)}
    />
    <Conditional
      show={showConditional.value}
      {...conditionalField.listeners}
    >
      <input type="text" {...conditionalField} />
    </Conditional>
  </form>
)
...
```
Opposed to other libraries, like `react-hook-form`, `<Conditional>` works with both controlled and uncontrolled fields. As of right now, multiple conditional fields will require being individually wrapped by a corresponding `<Conditional>` component.


## Deep dive

### Available atoms
#### `registerAtom`
- `get => null`
- `(get, set, field: string) => FieldObject`

#### `controlAtom`
- `get => null`
- `(get, set, field: string) => FieldObject`

#### `hiddenAtom`
- `get => null`
- `(get, set, field: string) => FieldObject`

#### `watchAtom`
- `(field: string) => FieldValue`
#### `validationAtom`
- `get => null`
- `(get, set, {resolver: Resolver, data?: FormData}) => void`

### Available hooks
#### `useField`
```ts
(field: string) => {
  ref: Ref,
  name: string,
  error: Error,
  [onChange | onClick | onInput]: (value: any) => void,
  listeners: {
    onMount: () => void,
    onUnmount: () => void
  }
}
```
#### `useControlledField`
```ts
(field: string, options?: { onChangeMiddleware: (value: any) => void }) => {
  value: any,
  error: Error,
  onChange: (value: any) => void,
  listeners: {
    onMount: () => void,
    onUnmount: () => void
  }
}
```
#### `useTransientField`
```ts
(field: string, options?: { onChangeMiddleware: (value: any) => void }) => {
  value: any,
  error: Error,
  onChange: (value: any) => void,
  listeners: {
    onUnmount: () => void
  }
}
```
## Mocking
### `mockField`

## Typescript
