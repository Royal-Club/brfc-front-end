import { Button, Drawer } from "antd";
import React, { useState } from "react";

export default function GoalKeeperDrawer() {
    const [open, setOpen] = useState(false);

    const showDrawer = () => {
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };
    return (
        <>
            <Button
                onClick={showDrawer}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                Goal Keeper List
            </Button>

            <Drawer title="Goal Keeper List" onClose={onClose} open={open}>
                data
            </Drawer>
        </>
    );
}
