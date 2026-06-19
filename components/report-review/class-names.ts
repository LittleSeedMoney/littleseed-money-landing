import { twMerge } from "tailwind-merge";

export function joinClasses(
  ...classes: Array<string | false | null | undefined>
) {
  return twMerge(...classes);
}
