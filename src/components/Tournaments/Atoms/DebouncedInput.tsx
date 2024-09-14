import React, { useState, useEffect, useCallback } from "react";
import { Input } from "antd";
import debounce from "lodash/debounce";
import { isDisabled } from "@testing-library/user-event/dist/utils";

interface DebouncedInputProps {
    placeholder?: string;
    debounceDuration?: number;
    onChange: (value: string) => void;
    value?: string; // Add the `value` prop to the interface
    isDisabled?: boolean;
}

const DebouncedInput: React.FC<DebouncedInputProps> = ({
    placeholder = "Enter text...",
    debounceDuration = 500,
    onChange,
    value: controlledValue, 
    isDisabled = false,
}) => {
    const [value, setValue] = useState(controlledValue || "");

    useEffect(() => {
        setValue(controlledValue || "");
    }, [controlledValue]);

    const debouncedOnChange = useCallback(
        debounce((newValue: string) => {
            onChange(newValue);
        }, debounceDuration),
        [onChange, debounceDuration]
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        debouncedOnChange(newValue);
    };

    return (
        <Input
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            disabled={isDisabled}
            style={{ 
                border :"none",
                outline:"none",
                borderBottom: "1px solid #ccc",
                borderRadius: 0,
             }}
        />
    );
};

export default DebouncedInput;
