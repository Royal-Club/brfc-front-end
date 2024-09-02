import React, { useState, useRef, useEffect } from "react";
import { Input, Typography } from "antd";
import { EditOutlined } from "@ant-design/icons";
import type { InputRef } from "antd";

interface DoubleClickTextInputFieldProps {
    initialName: string;
    onNameChange: (newName: string) => void;
}

const DoubleClickTextInputField: React.FC<DoubleClickTextInputFieldProps> = ({
    initialName,
    onNameChange,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(initialName);
    const [hovered, setHovered] = useState(false);
    const inputRef = useRef<InputRef>(null);

    const handleDoubleClick = () => {
        setIsEditing(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value.slice(0, 20)); // Limit to 20 characters
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (name !== initialName) {
            onNameChange(name);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleBlur();
        }
    };

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const displayName = name.length > 20 ? name.slice(0, 20) + "..." : name;

    return isEditing ? (
        <Input
            ref={inputRef}
            value={name}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyPress={handleKeyPress}
        />
    ) : (
        <div
            style={{ display: "flex", alignItems: "center" }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <Typography.Text
                onDoubleClick={handleDoubleClick}
                style={{ cursor: "pointer", marginRight: 4 }}
            >
                {displayName}
            </Typography.Text>
            {hovered && <EditOutlined onClick={handleDoubleClick} />}
        </div>
    );
};

export default DoubleClickTextInputField;
