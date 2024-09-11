import React, { useState, useEffect, useCallback } from "react";
import { Input } from "antd";
import debounce from "lodash/debounce";

interface DebouncedInputProps {
    placeholder?: string;
    debounceDuration?: number;
    onChange: (value: string) => void;
    value?: string; // Add the `value` prop to the interface
}

const DebouncedInput: React.FC<DebouncedInputProps> = ({
    placeholder = "Enter text...",
    debounceDuration = 500,
    onChange,
    value: controlledValue, // Use controlledValue to differentiate from internal state
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
