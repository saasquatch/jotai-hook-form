# `jotai-hook-form`

`jotai-hook-form` is a way to build out complex forms with jotai, built off of JSON Pointers.

Inspired by `react-hook-form`, it allows for the progressive building of a form data object, letting you add fields and manage the form data one field at a time.

## Table of Contents
- [`jotai-hook-form`](#jotai-hook-form)
  - [Table of Contents](#table-of-contents)
  - [Quick start](#quick-start)
  - [Building blocks](#building-blocks)
    - [Atom level: `createFormAtoms`](#atom-level-createformatoms)
    - [Hook level: `useFormAtoms`](#hook-level-useformatoms)
  - [Types of fields](#types-of-fields)
    - [Controlled fields: `fieldAtom`, `useControlledField`, `controlAtom`](#controlled-fields-fieldatom-usecontrolledfield-controlatom)
    - [Uncontrolled fields: `fieldAtom`, `useField`, `registerAtom`](#uncontrolled-fields-fieldatom-usefield-registeratom)
    - [Transient fields: `fieldAtom`, `useTransientField`, `hiddenAtom`](#transient-fields-fieldatom-usetransientfield-hiddenatom)
    - [Conditional fields: `<Conditional>`](#conditional-fields-conditional)
  - [Field-level validation](#field-level-validation)
  - [API](#api)
    - [Form atoms](#form-atoms)
    - [Field properties](#field-properties)
    - [Components](#components)
## Quick start

```tsx
import { useSetAtom } from 'jotai'
import { createFormAtoms, useFieldAtom } from 'jotai-hook-form'
import type { FieldAtom } from 'jotai-hook-form'

type FormData = {
  firstName: string;
  lastName: string;
  phoneNumber: number;
};

//1. Define your form data atom
const dataAtom = atom({} as FormData);
const { fieldAtom } = createFormAtoms<FormData>({ dataAtom });

//2. Initialise fields on your data atom
const firstNameFieldAtom = fieldAtom("/firstName")
const lastNameFieldAtom = fieldAtom("/lastName")
const phoneNumberFieldAtom = fieldAtom("/phoneNumber")

const submitAtom = atom(null, (set, get) => {
  const data = get(dataAtom)
  console.log("Form data:", { data })
})

const Form = () => {
  const submit = useSetAtom(submitAtom)

  return (
    <form onSubmit={submit}>
      <Field type="text" placeholder="First name" fieldAtom={firstNameFieldAtom} />
      <Field type="text" placeholder="Last name" fieldAtom={lastNameFieldAtom} />
      <Field type="number" placeholder="Phone number" fieldAtom={phoneNumberFieldAtom} />
      <button type="submit">Submit</button>
    </form>
  );
};

const Field = ({ fieldAtom: FieldAtom, ...inputProps }) => {
  const field = useFieldAtom(fieldAtom)

  return <input {...inputProps} {...field}/>
}
```

## Building blocks

`jotai-hook-form` makes available to tools to built form logic both at the atom level as well as the hook level. Depending on how you build out the form at which level, there are different functions at your disposal to make it possible.

### Atom level: `createFormAtoms`

`createFormAtoms` takes in a `dataAtom` which will hold your form data object. It accepts the optional `errorStackAtom`, which will be responsible for storing a mapping from a field's JSON Pointer, to an array of errors. There is also an optional third atom parameter for `transientFieldsAtom` which will hold all values for your [transient fields](#transient-fields-fieldatom-usetransientfield-hiddenatom).

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
- [`fieldAtom`](#fieldatom): Add a field to the form object, defaults to an [uncontrolled field](#uncontrolled-fields-fieldatom-usefield-registeratom)
- [`registerAtom`](#registeratom): Add an [uncontrolled field](#uncontrolled-fields-fieldatom-usefield-registeratom) to the form object
- [`controlAtom`](#controlatom): Add a [controlled field](#controlled-fields-fieldatom-usecontrolledfield-controlatom) to the form object
- [`hiddenAtom`](#hiddenatom): Add a [transient field](#transient-fields-fieldatom-usetransientfield-hiddenatom) to the transient fields object
- [`watchAtom`](#watchatom): Subscribe to an individual field (both form and transient)
- [`validationAtom`](#validationatom): Takes in a resolver that maps form data to errors and stores those errors in the `errorStackAtom`
- [`formActionsAtom`](#formactionsatom): A reducer atom. Currently supports resetting of the form state.
- [`setAtom`](#setatom): Can be used to set a specific field (form or transient).

From here, you can now use `fieldAtom` to specify all the fields within your form. These fields will be added as properties to the `dataAtom`

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

### Controlled fields: `fieldAtom`, `useControlledField`, `controlAtom`

Controlled fields are the bread-and-butter for more complex forms with fields needing more advanced logic than what is available from vanilla form elements. These would include components like `react-select`'s `Select`, or simply any form component that as input `value` and `onChange` as props.

Controlled fields can be created with `fieldAtom` by default

Otherwise, controlled fields can be built using the `useControlledField` hook, or using the `controlAtom` - for the `onChange` injection - in combination with the `watchAtom` to get the `value`. `controlAtom` is returned by `createFormAtoms` function, whereas `useControlledField` comes from `useFormAtoms`

```tsx
const lastNameFieldAtom = fieldAtom('/lastName')
```
is equivalent to
```tsx
const lastName = useControlledField('/lastName')
```
or
```tsx
const lastNameChangeAtom = set(controlAtom, '/lastName')
const lastNameValueAtom = watchAtom('/lastName')
```
### Uncontrolled fields: `fieldAtom`, `useField`, `registerAtom`

Uncontrolled fields are either vanilla HTML form elements (`input`, `select`, etc.) or components whose ref is attached to a vanilla form element (usually through the use of `forwardRef`). They have an internal, DOM-controlled value property that can be managed via refs, thereby not requiring re-renders to update their value within the element.

Uncontrolled fields are the optimal way to build forms as they can listen to input changes without needing a re-render to update the value in the view.

Uncontrolled fields can be handled by initialising a field with the `useField` hook, or the `registerAtom` that is returned by `createFormAtoms`

```tsx
const firstNameAtom = fieldAtom('/firstName', { type: 'uncontrolled' })
```
is equivalent to 
```tsx
const firstName = useField('/firstName')
```
or
```tsx
const firstNameAtom = set(registerAtom, '/firstName')
```


### Transient fields: `fieldAtom`, `useTransientField`, `hiddenAtom`
"Transient" fields, as we've coined them, are fields that exist within the form's view and logic but shouldn't be stored on the form data object. This is useful for fields that conditionally render different sections of a form, where you only want to store the actual data fields and not whether the section is showing.

**Transient fields are stored seperately to the data object**. `jotai-hook-form` will store these fields in the `transientFieldsAtom` passed into `createFormAtoms`. If this was not passed in, it will use an internal atom.

```tsx
const formSection = fieldAtom('/currentSection', { type: 'transient' })
```
is equivalent to
```tsx
const formSection = useTransientField('/currentSection')
```
or
```tsx
const formSectionAtom = set(hiddenAtom, '/currentSection')
const formSectionValueAtom = watchAtom('/currentSection')
```

Whereas fields created with `useField`, `useControlledField` are stored within the `dataAtom`'s object, fields created with `useTransientField` are stored either in an internal store specific to transient fields, or in the optional `transientStoreAtom` parameter of `createFormAtoms`.

Note: `useTransientField` acts exactly like `useControlledField` and does not try to be smart about the DOM element it is attached to, and must be controlled explicitly.


### Conditional fields: `<Conditional>`
In the case that fields need to be removed and re-added to the form data object whenever they leave or re-enter the DOM respectively (i.e. conditional fields), the `<Conditional>` component can wrap around the element within the view to listen to these changes.

`<Conditional>` takes in 4 props:
- `show: boolean`: A flag to conditionally render its children.
- `fields?: { listeners: Listeners }`: An array of field objects corresponding to the fields inside the `Conditional` component
- `onMount: () => void`: A function to run on-mount.
- `onUnmount: () => void`: A function to run on-unmount.

To connect a field that has already been initialised by one of the 3 hooks returned by `useFormAtoms`, you can spread the `listeners` property of the field on `<Conditional>`. This `listeners` property contains both `onMount` and `onUnmount` functions that will handle removing/re-adding the field to the form data object on event trigger.

Example:
```tsx
...
const conditionalFieldOne = useField('/conditionalFieldOne')
const conditionalFieldTwo = useField('/conditionalFieldTwo')
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
      fields={[conditionalFieldOne, conditionalFieldTwo]}
    >
      <input type="text" {...conditionalFieldOne} />
      <input type="text" {...conditionalFieldTwo} />
    </Conditional>
  </form>
)
...
```
Opposed to other libraries, like `react-hook-form`, `<Conditional>` works with both controlled and uncontrolled fields. 

## Field-level validation

Field level validation can be specified using the `validate` property within the optional config for `fieldAtom`, `useField`, or `useControlledField`.

An error object must be returned from the `validate` function. Error objects have `type: string`, and `message?: string` properties.

**Example**
```tsx
const validatedFieldAtom = fieldAtom('/validated', {
  validate: (field: { value: any, touched: boolean, dirty: boolean }) => {
    if (field.value === "" && field.touched) {
      return {
        type: "required",
        message: "This field is required"
      }
    }
  }
})
```


## API

| High-level API | Description |
|-----------|-------------|
| `createFormAtoms()` | A function to initialise a `jotai-hook-form` form. Takes in a `dataAtom` and optionally `errorStackAtom`, and `transientFieldsAtom` |
| `useFormAtoms()` | A hook to utilise the form atoms returned by `createFormAtoms` |
| `useFieldAtom()` | A hook that converts a field atom created by `fieldAtom` into an object representation |

### Form atoms
Atoms returned from `createFormAtoms`
| Form atoms | Description |
|-----------|-------------|
| `fieldAtom()` | An atom that specifies fields within the form's `dataAtom`, using JSON Pointers |
| `registerAtom()` | An atom that creates an uncontrolled field within the form's `dataAtom`, using JSON Pointers |
| `controlAtom()` | An atom that creates a controlled field within the form's `dataAtom`, using JSON Pointers |
| `hiddenAtom()` | An atom that creates a transient field within the form's `transientFieldsAtom`, using JSON Pointers |
| `watchAtom()` | An atom that listens to a property within the form's `dataAtom` |
| `errorAtom()` | An atom that listens to a field's error within the form's `errorStackAtom` |
| `errorStackAtom()` | An atom that stores form errors by JSON Pointer and error type |

### Field properties
Properties of a field when returned from `useFieldAtom`
| Properties | Description |
|------------|-------------|
| `name` | The JSON Pointer of the field |
| `value` | The current value of the field |
| `onChange` | The function to run when the field input value changes (not on uncontrolled fields) |
| `onBlur` | The function to run when the field input is blurred |
| `listeners` | Contains `onMount`, and `onUnmount` functions to pass into the `<Conditional>` component |
| `status` | Contains `dirty`, and `touched` statuses for the field |
| `error` | The current error value of the field |

### Components
| Component | Description |
|-----------|-------------|
| `Conditional` | Component that handles conditional form fields, removing them from the form `dataAtom` on unmount, and listening to onmount |
