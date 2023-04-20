import React from "react";

export const TestControlledField = ({ field }: { field: any }) => {
  return (
    <input
      type="text"
      id="controlled-input"
      value={field.value}
      onChange={e => field.onChange(e.target.value)}
    />
  );
};

export const TestUncontrolledField = ({ field }: { field: any }) => {
  return (
    <input
      type="text"
      id="uncontrolled-input"
      onChange={e => field.onChange(e.target.value)}
    />
  );
};

export const TestTransientField = ({ field }: { field: any }) => {
  return (
    <input
      type="text"
      id="transient-input"
      value={field.value}
      onChange={e => field.onChange(e.target.value)}
    />
  );
};
