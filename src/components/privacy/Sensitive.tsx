import { ReactNode, ElementType, HTMLAttributes } from "react";

type SensitiveProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  children: ReactNode;
};

/**
 * Wrap any UI containing sensitive financial data (income, monthly payment,
 * cash needed, home price, savings, etc.). When Private Mode is on the
 * contents are blurred via a global CSS rule (`html.private-mode [data-sensitive]`).
 * Hovering or focusing the region reveals the value.
 */
export function Sensitive({ as: Tag = "span", children, ...rest }: SensitiveProps) {
  return (
    <Tag data-sensitive="true" {...rest}>
      {children}
    </Tag>
  );
}
