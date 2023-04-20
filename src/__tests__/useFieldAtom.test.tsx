import { atom, useAtomValue } from "jotai";
import { renderHook } from "@testing-library/react-hooks";
import { fireEvent, render, screen } from "@testing-library/react";
import { createFormAtoms } from "../core/createForm";
import { useFieldAtom } from "../core/useFormAtoms";
import * as React from "react";
import { ControlSetReturn, FieldAtom } from "../core/types";
import "@testing-library/jest-dom";

const commonFields = {
  status: {
    dirty: false,
    touched: false
  },
  error: undefined
};

describe("useFieldAtom", () => {
  describe("defining field types", () => {
    test("controlled type returns the correct object type", () => {
      const dataAtom = atom({});
      const formAtoms = createFormAtoms({ dataAtom });

      const fieldAtom = formAtoms.fieldAtom("/email", { type: "controlled" });

      const { result } = renderHook(() => useFieldAtom(fieldAtom));
      expect(result.current).toEqual({
        ...commonFields,
        name: "/email",
        value: undefined,
        listeners: {
          onMount: expect.any(Function),
          onUnmount: expect.any(Function)
        },
        onChange: expect.any(Function),
        onBlur: expect.any(Function)
      });
    });

    test("uncontrolled type returns the correct object type", () => {
      const dataAtom = atom({});
      const formAtoms = createFormAtoms({ dataAtom });

      const fieldAtom = formAtoms.fieldAtom("/email", { type: "uncontrolled" });

      const { result } = renderHook(() => useFieldAtom(fieldAtom));
      expect(result.current).toEqual({
        ...commonFields,
        name: "/email",
        ref: expect.any(Function),
        listeners: {
          onMount: expect.any(Function),
          onUnmount: expect.any(Function)
        },
        onChange: expect.any(Function),
        onBlur: expect.any(Function)
      });
    });

    test("transient type returns the correct object type", () => {
      const dataAtom = atom({});
      const formAtoms = createFormAtoms({ dataAtom });

      const fieldAtom = formAtoms.fieldAtom("/email", { type: "transient" });

      const { result } = renderHook(() => useFieldAtom(fieldAtom));
      expect(result.current).toEqual({
        ...commonFields,
        listeners: {
          onUnmount: expect.any(Function)
        },
        value: undefined,
        name: "/email",
        onChange: expect.any(Function)
      });
    });
  });

  describe("interaction with dataAtom", () => {
    const FieldComponent = ({
      fieldAtom
    }: {
      fieldAtom: FieldAtom<ControlSetReturn>;
    }) => {
      const field = useFieldAtom(fieldAtom);

      return (
        <input
          aria-label="field-input"
          type="text"
          value={field.value}
          onChange={e => field.onChange(e.target.value)}
        />
      );
    };

    it("derives it's value from dataAtom", () => {
      const dataAtom = atom({ email: "email@example.com" });
      const formAtoms = createFormAtoms({ dataAtom });

      const fieldAtom = formAtoms.fieldAtom("/email");

      render(<FieldComponent fieldAtom={fieldAtom} />);

      expect(screen.getByDisplayValue("email@example.com")).toBeInTheDocument();
    });

    it("should mutate dataAtom onChange", () => {
      const dataAtom = atom({ email: "email@example.com" });
      const formAtoms = createFormAtoms({ dataAtom });

      const fieldAtom = formAtoms.fieldAtom("/email");
      render(<FieldComponent fieldAtom={fieldAtom} />);

      fireEvent.change(screen.getByRole("textbox"), {
        target: {
          value: "new-email@example.com"
        }
      });

      const { result: data } = renderHook(() => useAtomValue(dataAtom));

      expect(data.current).toEqual({ email: "new-email@example.com" });
      expect(
        screen.getByDisplayValue("new-email@example.com")
      ).toBeInTheDocument();
    });
  });
});
