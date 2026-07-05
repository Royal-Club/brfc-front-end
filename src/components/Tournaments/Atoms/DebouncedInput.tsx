import React, { useState, useEffect, useCallback } from "react";
import { Input } from "antd";
import debounce from "lodash/debounce";

interface DebouncedInputProps {
    placeholder?: string;
    debounceDuration?: number;
    onChange: (value: string) => void;
    value?: string; // Add the `value` prop to the interface
    isDisabled?: boolean;
    className?: string;
    /** Render a multi-line auto-sizing textarea that grows up to `maxRows` lines. */
    autoSize?: boolean;
    maxRows?: number;
}

const DebouncedInput: React.FC<DebouncedInputProps> = ({
    placeholder = "Enter text...",
    debounceDuration = 500,
    onChange,
    value: controlledValue,
    isDisabled = false,
    className,
    autoSize = false,
    maxRows = 2,
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

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const newValue = e.target.value;
        setValue(newValue);
        debouncedOnChange(newValue);
    };

    const sharedStyle = {
        border: "none",
        outline: "none",
        borderBottom: "1px solid #ccc",
        borderRadius: 0,
    };

    if (autoSize) {
        return (
            <Input.TextArea
                className={className}
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                disabled={isDisabled}
                autoSize={{ minRows: 1, maxRows }}
                style={{ ...sharedStyle, resize: "none" }}
            />
        );
    }

    return (
        <Input
            className={className}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            disabled={isDisabled}
            style={sharedStyle}
        />
    );
};

export default DebouncedInput;
