import { atom } from "jotai";
import { FieldAtom } from "../core/types";

export const updateAtom = atom(
  null,
  (get, set, { fieldAtom, next }: { fieldAtom: FieldAtom<any>; next: any }) => {
    const { onChange } = set(get(fieldAtom).configAtom);
    onChange(next);
  }
);
