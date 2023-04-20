import { atom } from "jotai";
import { createFormAtoms } from "../core/createForm";

describe("createFormAtoms", () => {
  it("requires a dataAtom", () => {
    const dataAtom = atom({});
    const formAtoms = createFormAtoms({ dataAtom });
    expect(formAtoms).toBeDefined();
  });
});
