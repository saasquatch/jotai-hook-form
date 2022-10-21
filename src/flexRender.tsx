import * as React from "react";

export type Renderable<TProps> = React.ReactNode | React.ComponentType<TProps>;

export function flexRender<TProps extends object>(
  Comp: Renderable<TProps>,
  props: TProps
): React.ReactNode | JSX.Element {
  return !Comp ? null : isReactComponent<TProps>(Comp) ? (
    <Comp {...props} />
  ) : (
    Comp
  );
}

function isReactComponent<TProps>(
  component: unknown
): component is React.ComponentType<TProps> {
  return (
    isClassComponent(component) ||
    typeof component === "function" ||
    isExoticComponent(component)
  );
}

function isClassComponent(component: any) {
  return (
    typeof component === "function" &&
    (() => {
      const proto = Object.getPrototypeOf(component);
      return proto.prototype && proto.prototype.isReactComponent;
    })()
  );
}

function isExoticComponent(component: any) {
  return (
    typeof component === "object" &&
    typeof component.$$typeof === "symbol" &&
    ["react.memo", "react.forward_ref"].includes(component.$$typeof.description)
  );
}
