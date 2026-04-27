import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import * as React from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

function hasInputValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null && String(value).length > 0;
}

type ClearableInputProps = Omit<
  React.ComponentProps<typeof InputGroupInput>,
  "className" | "onChange"
> & {
  className?: string;
  inputClassName?: string;
  clearLabel?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onClear?: () => void;
  onValueChange?: (value: string) => void;
};

function ClearableInput({
  className,
  inputClassName,
  clearLabel = "Clear input",
  value,
  defaultValue,
  disabled,
  readOnly,
  onChange,
  onClear,
  onValueChange,
  ...props
}: ClearableInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue ?? "",
  );
  const currentValue = isControlled ? value : uncontrolledValue;
  const showClearButton = hasInputValue(currentValue);
  const canClear = !disabled && !readOnly;

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (!isControlled) {
      setUncontrolledValue(event.target.value);
    }

    onValueChange?.(event.target.value);
    onChange?.(event);
  }

  function handleClear() {
    if (!canClear) {
      return;
    }

    if (!isControlled) {
      setUncontrolledValue("");
    }

    onValueChange?.("");
    onClear?.();
    inputRef.current?.focus();
  }

  return (
    <InputGroup
      className={cn("rounded-xl", className)}
      data-disabled={disabled ? true : undefined}
    >
      <InputGroupInput
        ref={inputRef}
        value={isControlled ? value : uncontrolledValue}
        disabled={disabled}
        readOnly={readOnly}
        onChange={handleChange}
        className={inputClassName}
        {...props}
      />
      {showClearButton ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            variant="destructive"
            size="icon-xs"
            aria-label={clearLabel}
            disabled={!canClear}
            onClick={handleClear}
          >
            <XIcon />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}

export { ClearableInput };
